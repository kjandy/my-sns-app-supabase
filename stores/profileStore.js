/**
 * プロフィールとフォローのストア（stores/profileStore.js）
 *
 * 第4回 ：プロフィール（fetchProfile / updateProfile）を profiles テーブルに切り替えた。
 * 第10回：フォロー（follow / unfollow …）を follows テーブルに切り替えた。
 *
 * profile の形：{ uid, displayName, photoURL, bio, location, bannerURL }
 */
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// DB の列名（snake_case）→ アプリで使う名前（camelCase）に詰め替える
export const toProfile = (row) =>
  row
    ? {
        uid: row.id,
        displayName: row.display_name,
        photoURL: row.photo_url,
        bio: row.bio,
        location: row.location,
        bannerURL: row.banner_url,
      }
    : null;

const useProfileStore = create((set, get) => ({
  // --- State ---
  profiles: {}, // { [uid]: profile } 一度読んだプロフィールを覚えておく（null は「見つからない」）
  followingIds: [], // 自分がフォローしている人の uid 一覧
  followCounts: {}, // { [uid]: { following, followers } }

  // --- 読み込み ---
  fetchProfile: async (uid) => {
    // maybeSingle() … 0件なら null、1件ならその行を返す（2件以上はエラー）
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (error) console.error('fetchProfile', error.message); // 例：uid の形式が不正
    const profile = toProfile(data);
    set({ profiles: { ...get().profiles, [uid]: profile } });
    return profile;
  },
  // 自分がフォローしている人の uid 一覧
  fetchMyFollowing: async (myUid) => {
    const { data, error } = await supabase.from('follows').select('followee_id').eq('follower_id', myUid);
    if (error) console.error('fetchMyFollowing', error.message);
    set({ followingIds: (data ?? []).map((row) => row.followee_id) });
  },
  // フォロー数・フォロワー数
  //   { count: 'exact', head: true } … 行の中身は受け取らず、件数だけ数えてもらう
  fetchFollowCounts: async (uid) => {
    const countBy = (column) =>
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq(column, uid);
    const [following, followers] = await Promise.all([countBy('follower_id'), countBy('followee_id')]);
    const counts = { following: following.count ?? 0, followers: followers.count ?? 0 };
    set({ followCounts: { ...get().followCounts, [uid]: counts } });
  },

  // --- 書き込み ---
  // RLS により、自分の行しか更新できない（他人の id を渡しても 0件更新になるだけ）
  updateProfile: async (uid, data) => {
    const { data: row, error } = await supabase
      .from('profiles')
      .update({
        display_name: data.displayName,
        bio: data.bio,
        location: data.location,
        banner_url: data.bannerURL,
      })
      .eq('id', uid)
      .select()
      .single();
    if (error) throw new Error(`プロフィールの更新に失敗しました：${error.message}`);
    set({ profiles: { ...get().profiles, [uid]: toProfile(row) } });
  },
  // フォローする（follower_id は DB の default auth.uid() が入る）
  follow: async (myUid, targetUid) => {
    if (myUid === targetUid) return; // DB の check 制約でも拒否されるが、送る前に止める
    const { error } = await supabase.from('follows').insert({ followee_id: targetUid });
    if (error && error.code !== '23505') throw new Error(`フォローに失敗しました：${error.message}`);
    await Promise.all([get().fetchMyFollowing(myUid), get().fetchFollowCounts(targetUid)]);
  },
  unfollow: async (myUid, targetUid) => {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: myUid, followee_id: targetUid });
    if (error) throw new Error(`フォロー解除に失敗しました：${error.message}`);
    await Promise.all([get().fetchMyFollowing(myUid), get().fetchFollowCounts(targetUid)]);
  },
}));

export default useProfileStore;

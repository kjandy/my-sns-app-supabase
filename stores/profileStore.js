/**
 * プロフィールとフォローのストア（stores/profileStore.js）
 *
 * 第4回：プロフィール（fetchProfile / updateProfile）を Supabase の profiles テーブルに切り替えた。
 * フォロー（follow / unfollow …）は、まだメモリ上のニセのデータベース。第10回で切り替える。
 *
 * profile の形：{ uid, displayName, photoURL, bio, location, bannerURL }
 */
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { dummyFollows } from '@/lib/dummyData';

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

// フォローは第10回まで、メモリ上のニセのデータベースのまま
const mockDb = { follows: [...dummyFollows] };

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
  fetchMyFollowing: async (myUid) => {
    set({ followingIds: mockDb.follows.filter((f) => f.followerId === myUid).map((f) => f.followeeId) });
  },
  fetchFollowCounts: async (uid) => {
    const counts = {
      following: mockDb.follows.filter((f) => f.followerId === uid).length,
      followers: mockDb.follows.filter((f) => f.followeeId === uid).length,
    };
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
  follow: async (myUid, targetUid) => {
    if (myUid === targetUid) return;
    mockDb.follows.push({ followerId: myUid, followeeId: targetUid });
    await Promise.all([get().fetchMyFollowing(myUid), get().fetchFollowCounts(targetUid)]);
  },
  unfollow: async (myUid, targetUid) => {
    mockDb.follows = mockDb.follows.filter((f) => !(f.followerId === myUid && f.followeeId === targetUid));
    await Promise.all([get().fetchMyFollowing(myUid), get().fetchFollowCounts(targetUid)]);
  },
}));

export default useProfileStore;

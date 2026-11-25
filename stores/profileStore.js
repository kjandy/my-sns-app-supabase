/**
 * プロフィールとフォローのストア（stores/profileStore.js）— 第3回：モック版
 *
 * postStore と同じく、第3回はメモリ上のニセのデータベースを読み書きする。
 * 第10回で Supabase（profiles / follows テーブル）に差し替える。
 *
 * profile の形：{ uid, displayName, photoURL, bio, location, bannerURL }
 */
import { create } from 'zustand';
import { dummyFollows, dummyUsers } from '@/lib/dummyData';

const mockDb = {
  profiles: dummyUsers.map(({ email, ...p }) => ({ ...p })), // email は公開しないので外す
  follows: [...dummyFollows],
};

const useProfileStore = create((set, get) => ({
  // --- State ---
  profiles: {}, // { [uid]: profile } 一度読んだプロフィールを覚えておく
  followingIds: [], // 自分がフォローしている人の uid 一覧
  followCounts: {}, // { [uid]: { following, followers } }

  // --- 読み込み ---
  fetchProfile: async (uid) => {
    const profile = mockDb.profiles.find((p) => p.uid === uid) ?? null;
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
  updateProfile: async (uid, data) => {
    mockDb.profiles = mockDb.profiles.map((p) => (p.uid === uid ? { ...p, ...data } : p));
    await get().fetchProfile(uid);
  },
  follow: async (myUid, targetUid) => {
    if (myUid === targetUid) return; // 自分はフォローできない
    mockDb.follows.push({ followerId: myUid, followeeId: targetUid });
    await Promise.all([get().fetchMyFollowing(myUid), get().fetchFollowCounts(targetUid)]);
  },
  unfollow: async (myUid, targetUid) => {
    mockDb.follows = mockDb.follows.filter((f) => !(f.followerId === myUid && f.followeeId === targetUid));
    await Promise.all([get().fetchMyFollowing(myUid), get().fetchFollowCounts(targetUid)]);
  },
}));

export default useProfileStore;

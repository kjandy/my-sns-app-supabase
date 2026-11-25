/**
 * ログイン状態のストア（stores/authStore.js）— 第3回：モック版
 *
 * ★このストアの「形」（user / loading / signOut など）は、第4回で Supabase の
 *   本物の認証に差し替えても変わらない。画面側は useAuthStore() を使うだけなので、
 *   中身を入れ替えても画面のコードはほとんど直さなくてよい。
 *
 * user の形：{ uid, email, displayName, photoURL }
 */
import { create } from 'zustand';
import { dummyUsers } from '@/lib/dummyData';

const toUser = (u) => (u ? { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL } : null);

const useAuthStore = create((set) => ({
  // --- State ---
  user: toUser(dummyUsers[0]), // 最初は u1 でログインしている“ことにする”
  loading: false, // 本物の認証では「判定中」がある（第4回）。モックでは常に false

  // --- Actions ---
  // 開発用：ログイン中のユーザーを切り替える（モックにしかない機能）
  switchUser: (uid) => set({ user: toUser(dummyUsers.find((u) => u.uid === uid)) }),
  signOut: async () => {
    set({ user: null });
    return { success: true };
  },
}));

export default useAuthStore;

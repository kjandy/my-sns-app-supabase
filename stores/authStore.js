/**
 * ログイン状態のストア（stores/authStore.js）— Supabase版（第4回：メール、第5回：Google）
 *
 * ★第3回のモック版と「形」は同じ（user / loading / signOut …）。
 *   画面側は useAuthStore() を使うだけなので、ほとんど書き換えずに済む。
 *
 * user の形：{ uid, email, displayName, photoURL }
 *   Supabase の user は id や user_metadata.full_name という名前なので、
 *   toAppUser() で詰め替えてから state に入れる。
 */
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Supabase の user を、このアプリで使う形に詰め替える
function toAppUser(user) {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    uid: user.id,
    email: user.email,
    displayName: meta.full_name ?? meta.name ?? user.email?.split('@')[0] ?? null,
    photoURL: meta.avatar_url ?? meta.picture ?? null,
  };
}

const useAuthStore = create((set) => ({
  // --- State ---
  user: null,
  loading: true, // 最初の判定（onAuthStateChange の1回目）が終わるまでは true
  error: null,
  notice: null, // 「確認メールを送りました」などのお知らせ

  // --- Actions ---
  setUser: (user) => set({ user, loading: false }),
  clearMessages: () => set({ error: null, notice: null }),

  // メール＋パスワードでログイン
  signIn: async (email, password) => {
    set({ error: null, notice: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = getAuthErrorMessage(error);
      set({ error: msg });
      throw new Error(msg);
    }
    // user のセットは onAuthStateChange（initAuth）に任せる（状態を変える場所を1つにする）
  },

  // メール＋パスワードで新規登録
  signUp: async (email, password, displayName) => {
    set({ error: null, notice: null });
    if (password.length < 6) {
      const msg = 'パスワードは6文字以上である必要があります';
      set({ error: msg });
      throw new Error(msg);
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // ここに入れた値は auth.users の raw_user_meta_data に保存され、
      // トリガー handle_new_user() が profiles.display_name にコピーする
      options: {
        data: { full_name: displayName?.trim() || null },
        // 「Confirm email」が ON のとき、確認リンクを開いた後の戻り先（第5回で作ったルート）
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      const msg = getAuthErrorMessage(error);
      set({ error: msg });
      throw new Error(msg);
    }
    // 「Confirm email」が ON だと、この時点ではまだログインしていない（session が null）
    const needsConfirmation = !data.session;
    if (needsConfirmation) {
      set({ notice: '確認メールを送信しました。メール内のリンクを開いてください。' });
    }
    return { needsConfirmation };
  },

  // Googleでログイン
  signInWithGoogle: async () => {
    set({ error: null, notice: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // ④ Supabase が最後に戻してくる先（＝自分のアプリの callback ルート）
        redirectTo: `${location.origin}/auth/callback`,
        // 毎回アカウント選択画面を出す（複数のGoogleアカウントを持つ人のため）
        queryParams: { prompt: 'select_account' },
      },
    });
    // 成功するとページごと Google へ移動するので、この先は基本的に実行されない
    if (error) {
      const msg = getAuthErrorMessage(error);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      const message = 'ログアウトに失敗しました。もう一度お試しください。';
      set({ error: message });
      return { success: false, error: message };
    }
    set({ user: null, error: null, notice: null });
    return { success: true };
  },
}));

// Supabase のエラーコードを、画面に出す日本語に変換する
function getAuthErrorMessage(error) {
  const messages = {
    invalid_credentials: 'メールアドレスまたはパスワードが間違っています',
    email_not_confirmed: 'メールアドレスの確認が済んでいません。確認メールのリンクを開いてください',
    user_already_exists: 'このメールアドレスは既に登録されています',
    email_exists: 'このメールアドレスは既に登録されています',
    weak_password: 'パスワードが弱すぎます。6文字以上にしてください',
    email_address_invalid: 'メールアドレスの形式が正しくありません',
    email_address_not_authorized:
      'このアドレスには確認メールを送れません（Supabase標準メールの制限）。「Confirm email」をOFFにしてください',
    over_email_send_rate_limit: 'メールの送信回数の上限に達しました。しばらく待ってからお試しください',
    over_request_rate_limit: 'しばらく待ってから再度お試しください',
    provider_disabled: 'この認証方法はSupabase側で有効になっていません',
    signup_disabled: '新規登録が無効になっています',
  };
  return messages[error.code] || `認証エラー: ${error.message}`;
}

/**
 * ログイン状態の監視を始める（ClientLayout から1回だけ呼ぶ）
 *
 * 購読した直後に1回（INITIAL_SESSION）、その後はログイン・ログアウト・
 * トークン更新のたびに呼ばれる。戻り値は購読を解除する関数。
 *
 * ★コールバックの中で await supabase.xxx() を呼ばないこと。
 *   supabase-js の内部の仕組みとぶつかって、以降の通信が止まる不具合が報告されている。
 */
export function initAuth() {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setUser(toAppUser(session?.user));
  });
  return () => data.subscription.unsubscribe();
}

export default useAuthStore;

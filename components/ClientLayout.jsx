'use client';

import { useEffect } from 'react';
import Header from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import useAuthStore, { initAuth } from '@/stores/authStore';
import useProfileStore from '@/stores/profileStore';

/**
 * 全ページ共通の枠（components/ClientLayout.jsx）
 *
 * app/layout.js から <body> の直下に置く。どのページへ移動してもマウントされたまま
 * 残るので、「アプリ全体で1回だけ行う処理」をここに書く。
 */
export const ClientLayout = ({ children }) => {
  // ログイン状態の監視を始める。戻り値（購読解除の関数）はクリーンアップで必ず呼ぶ
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe();
  }, []);

  // ログインしたら、自分のプロフィール（表示名・アイコン）を読み込んでおく
  //   ★initAuth の中（onAuthStateChange のコールバック）では読まない。ここで読む
  const uid = useAuthStore((s) => s.user?.uid);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  useEffect(() => {
    if (uid) fetchProfile(uid);
  }, [uid, fetchProfile]);

  return (
    <>
      <Header />
      {/* pb-16 … スマホでは下部ナビに最後の投稿が隠れないよう余白をとる */}
      <div className="pb-16 md:pb-0">{children}</div>
      <MobileNav />
    </>
  );
};

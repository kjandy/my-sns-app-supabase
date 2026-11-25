'use client';

import { useEffect } from 'react';
import Header from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import useAuthStore, { initAuth } from '@/stores/authStore';
import useProfileStore from '@/stores/profileStore';
import useDmStore from '@/stores/dmStore';

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

  // DMの会話一覧（未読バッジ用）を読み込み、更新を購読する。アプリ全体でここ1か所だけ
  const fetchConversations = useDmStore((s) => s.fetchConversations);
  const subscribeConversations = useDmStore((s) => s.subscribeConversations);
  useEffect(() => {
    if (!uid) return;
    fetchConversations();
    const unsubscribe = subscribeConversations();
    return () => unsubscribe();
  }, [uid, fetchConversations, subscribeConversations]);

  return (
    <>
      <Header />
      {/* pb-16 … スマホでは下部ナビに最後の投稿が隠れないよう余白をとる */}
      <div className="pb-16 md:pb-0">{children}</div>
      <MobileNav />
    </>
  );
};

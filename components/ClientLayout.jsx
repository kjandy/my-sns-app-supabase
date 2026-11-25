'use client';

import { useEffect } from 'react';
import Header from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { initAuth } from '@/stores/authStore';

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

  return (
    <>
      <Header />
      {/* pb-16 … スマホでは下部ナビに最後の投稿が隠れないよう余白をとる */}
      <div className="pb-16 md:pb-0">{children}</div>
      <MobileNav />
    </>
  );
};

'use client';

import Header from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';

/**
 * 全ページ共通の枠（components/ClientLayout.jsx）
 *
 * app/layout.js から <body> の直下に置く。どのページへ移動しても
 * マウントされたまま残るので、「アプリ全体で1回だけ行う処理」
 * （第4回のログイン状態の監視など）もここに書くことになる。
 */
export const ClientLayout = ({ children }) => {
  return (
    <>
      <Header />
      {/* pb-16 … スマホでは下部ナビに最後の投稿が隠れないよう余白をとる */}
      <div className="pb-16 md:pb-0">{children}</div>
      <MobileNav />
    </>
  );
};

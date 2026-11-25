'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 「← タイトル」の見出し（components/PageHeader.jsx）
 * 投稿詳細・プロフィールなど、トップ以外のページの一番上に置く。
 */
export const PageHeader = ({ title }) => {
  const router = useRouter();
  return (
    <div className="sticky top-14 z-40 flex items-center gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur-md md:px-6">
      <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="戻る">
        <ArrowLeft className="size-5" />
      </Button>
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
  );
};

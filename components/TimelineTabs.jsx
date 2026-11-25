'use client';

import { cn } from '@/lib/utils';

/**
 * タイムラインの「おすすめ／フォロー中」タブ（components/TimelineTabs.jsx）
 * どちらが選ばれているか（value）と、切り替えたときの処理（onChange）を外から受け取る。
 */
export const TimelineTabs = ({ value, onChange }) => {
  const tabs = [
    { key: 'public', label: 'おすすめ' },
    { key: 'following', label: 'フォロー中' },
  ];
  return (
    <div className="flex border-b">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={cn(
            // -mb-px … 下線を親の border-b にぴったり重ねるための調整
            '-mb-px flex-1 border-b-2 py-4 text-center text-[15px] font-bold transition-colors hover:bg-muted/40',
            value === tab.key
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

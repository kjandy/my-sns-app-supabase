'use client';

import useAuthStore from '@/stores/authStore';
import { dummyUsers } from '@/lib/dummyData';

/**
 * 開発用：ログイン中ユーザーの切り替え（components/dev/DevUserSwitcher.jsx）
 *
 * 本物のログインを作る前に「他の人として見たらどうなるか」を確認するための道具。
 * 第4回で本物の認証に置き換えたら、このファイルは削除する。
 */
export const DevUserSwitcher = () => {
  const { user, switchUser } = useAuthStore();
  return (
    <div className="fixed bottom-20 left-4 z-50 rounded-lg border bg-background/95 p-2 text-xs shadow md:bottom-4">
      <label className="flex items-center gap-2">
        <span className="font-bold text-muted-foreground">開発用：ログイン中</span>
        <select
          value={user?.uid ?? ''}
          onChange={(e) => switchUser(e.target.value)}
          className="rounded border bg-background px-1 py-0.5"
        >
          {dummyUsers.map((u) => (
            <option key={u.uid} value={u.uid}>
              {u.displayName}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

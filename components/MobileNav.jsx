'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Mail, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DUMMY_CURRENT_USER_ID } from '@/lib/dummyData';

/**
 * スマホ用の下部ナビゲーション（components/MobileNav.jsx）
 * md:hidden … PC幅では表示しない（PCはヘッダーにナビがある）
 */
export const MobileNav = () => {
  const pathname = usePathname();
  const uid = DUMMY_CURRENT_USER_ID; // 第3回でストアに置き換える

  const items = [
    { href: '/', label: 'ホーム', Icon: Home },
    { href: `/profile/${uid}`, label: 'プロフィール', Icon: User },
    { href: '/messages', label: 'メッセージ', Icon: Mail },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t bg-background/95 backdrop-blur-md md:hidden">
      {items.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          className={cn(
            'flex flex-1 items-center justify-center py-3.5',
            pathname === href ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          <Icon className="size-7" />
        </Link>
      ))}
    </nav>
  );
};

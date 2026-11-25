'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Mail, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import useAuthStore from '@/stores/authStore';
import useDmStore, { selectHasUnread } from '@/stores/dmStore';
import { UnreadDot } from '@/components/UnreadDot';

/**
 * スマホ用の下部ナビゲーション（components/MobileNav.jsx）
 * md:hidden … PC幅では表示しない（PCはヘッダーにナビがある）
 */
export const MobileNav = () => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const hasUnread = useDmStore(selectHasUnread);
  if (!user) return null; // 未ログインなら出さない
  const uid = user.uid;

  const items = [
    { href: '/', label: 'ホーム', Icon: Home },
    { href: `/profile/${uid}`, label: 'プロフィール', Icon: User },
    { href: '/messages', label: 'メッセージ', Icon: Mail, badge: hasUnread },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t bg-background/95 backdrop-blur-md md:hidden">
      {items.map(({ href, label, Icon, badge }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          className={cn(
            'flex flex-1 items-center justify-center py-3.5',
            pathname === href ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          <span className="relative inline-flex">
            <Icon className="size-7" />
            {badge && <UnreadDot />}
          </span>
        </Link>
      ))}
    </nav>
  );
};

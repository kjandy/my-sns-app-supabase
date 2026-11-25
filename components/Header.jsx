'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LogOut, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';
import { DUMMY_CURRENT_USER_ID, dummyUsers } from '@/lib/dummyData';

/**
 * 画面上部のヘッダー（components/Header.jsx）
 *
 * PC（md以上）：アイコン＋文字のナビゲーションを表示
 * スマホ　　　：ナビゲーションは画面下の MobileNav に任せ、ここには出さない
 */
export default function Header() {
  const pathname = usePathname();
  // 第1回は固定のダミーユーザー（第3回でストアに置き換える）
  const user = dummyUsers.find((u) => u.uid === DUMMY_CURRENT_USER_ID);

  const navItems = [
    { href: '/', label: 'ホーム', Icon: Home },
    { href: `/profile/${user.uid}`, label: 'プロフィール', Icon: User },
    { href: '/messages', label: 'メッセージ', Icon: Mail },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 md:px-8">
        <Link href={`/profile/${user.uid}`} aria-label="自分のプロフィール">
          <UserAvatar name={user.displayName} photoURL={user.photoURL} className="size-11" />
        </Link>

        <nav className="flex items-center gap-1">
          {/* hidden md:flex … スマホでは隠し、md（768px）以上で横並びにする */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map(({ href, label, Icon }) => (
              <Button
                key={href}
                asChild
                variant="ghost"
                size="lg"
                className={cn(
                  'gap-2',
                  pathname === href ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                <Link href={href}>
                  <Icon className="size-6" />
                  <span>{label}</span>
                </Link>
              </Button>
            ))}
          </div>

          <div className="ml-2 flex items-center border-l pl-2">
            {/* 第1回は見た目だけ。第4回で本物のログアウト処理をつなぐ */}
            <Button asChild variant="ghost" size="icon-lg" aria-label="ログアウト">
              <Link href="/login">
                <LogOut className="size-6" />
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}

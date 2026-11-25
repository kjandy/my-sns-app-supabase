'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LogOut, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';
import useAuthStore from '@/stores/authStore';
import useProfileStore from '@/stores/profileStore';

/**
 * 画面上部のヘッダー（components/Header.jsx）
 *
 * PC（md以上）：アイコン＋文字のナビゲーションを表示
 * スマホ　　　：ナビゲーションは画面下の MobileNav に任せ、ここには出さない
 */
export default function Header() {
  const pathname = usePathname();
  // ログイン中のユーザーはストアから取り出す（第3回）
  const { user, loading, signOut } = useAuthStore();
  const router = useRouter();
  // 表示名・アイコンは profiles テーブルの値を優先する（編集するとすぐ反映される）
  const myProfile = useProfileStore((s) => (user ? s.profiles[user.uid] : null));

  const handleSignOut = async () => {
    const result = await signOut();
    if (!result.success) {
      window.alert(result.error);
      return;
    }
    router.replace('/login');
    router.refresh(); // サーバー側にも「ログアウトした」状態で描画し直してもらう
  };

  // 判定中・未ログインのときは、ロゴ代わりの丸と「ログイン」ボタンだけ出す
  if (loading || !user) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex size-11 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            S
          </Link>
          {!loading && (
            <Button asChild size="sm">
              <Link href="/login">ログイン</Link>
            </Button>
          )}
        </div>
      </header>
    );
  }

  const navItems = [
    { href: '/', label: 'ホーム', Icon: Home },
    { href: `/profile/${user.uid}`, label: 'プロフィール', Icon: User },
    { href: '/messages', label: 'メッセージ', Icon: Mail },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 md:px-8">
        <Link href={`/profile/${user.uid}`} aria-label="自分のプロフィール">
          <UserAvatar
            name={myProfile?.displayName ?? user.displayName}
            photoURL={myProfile?.photoURL ?? user.photoURL}
            className="size-11"
          />
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
            <Button variant="ghost" size="icon-lg" aria-label="ログアウト" onClick={handleSignOut}>
              <LogOut className="size-6" />
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}

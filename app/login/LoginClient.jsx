'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleIcon } from '@/components/GoogleIcon';

/**
 * ログイン画面（app/login/LoginClient.jsx）
 *
 * 第2回は「見た目」だけ。ボタンを押すとトップへ移動するだけにしておく。
 * 第4回でメール＋パスワード、第5回で Google の本物の処理をつなぐ。
 */
export const LoginClient = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error] = useState(null);

  const handleSignIn = (e) => {
    e.preventDefault();
    router.push('/'); // 仮の動き
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-none sm:border sm:shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">ログイン</CardTitle>
          <CardDescription className="text-center">アカウントにログインしてください</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
            <GoogleIcon />
            Googleでログイン
          </Button>

          {/* 「または」の区切り線：横線の上に、背景色を敷いた文字を重ねる */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">または</span>
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">ユーザー名（新規登録時）</Label>
              <Input id="displayName" placeholder="例：Koji" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              <p className="text-xs text-muted-foreground">※空欄のときは、メールアドレスの@より前が名前になります</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input id="password" type="password" placeholder="6文字以上" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                ログイン
              </Button>
              {/* type="button" … フォーム送信（＝ログイン）を発火させない */}
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.push('/')}>
                新規登録
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

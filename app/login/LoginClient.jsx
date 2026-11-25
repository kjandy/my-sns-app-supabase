'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleIcon } from '@/components/GoogleIcon';
import useAuthStore from '@/stores/authStore';

/**
 * ログイン画面（app/login/LoginClient.jsx）— 第4回：メール＋パスワードをつなぐ
 * Google ログインは第5回でつなぐ。
 */
export const LoginClient = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { error, notice, signIn, signUp } = useAuthStore();

  // ログインできたらトップへ。router.refresh() で、サーバー側（proxy など）にも
  // 新しい Cookie で判定し直してもらう
  const goHome = () => {
    router.replace('/');
    router.refresh();
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      goHome();
    } catch {
      // エラーの文言は authStore の error に入っている
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      const { needsConfirmation } = await signUp(email, password, displayName);
      if (!needsConfirmation) goHome(); // 確認メールが不要（授業の設定）ならそのままログイン済み
    } catch {
      // エラーの文言は authStore の error に入っている
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-none sm:border sm:shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">ログイン</CardTitle>
          <CardDescription className="text-center">アカウントにログインしてください</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 第5回でつなぐ */}
          <Button variant="outline" className="w-full" disabled>
            <GoogleIcon />
            Googleでログイン（第5回）
          </Button>

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
              <Input id="displayName" placeholder="例：Koji" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isLoading} />
              <p className="text-xs text-muted-foreground">※空欄のときは、メールアドレスの@より前が名前になります</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input id="password" type="password" placeholder="6文字以上" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={isLoading} />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {notice && (
              <Alert>
                <AlertDescription>{notice}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? '処理中...' : 'ログイン'}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={handleSignUp} disabled={isLoading}>
                新規登録
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

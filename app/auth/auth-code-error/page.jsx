import Link from 'next/link';
import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Googleログインやメール確認に失敗したときに表示する画面（第5回で使う）
export default function AuthCodeErrorPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-56px)] max-w-md flex-col items-center justify-center gap-4 p-4 text-center">
      <CircleAlert className="size-10 text-destructive" />
      <h1 className="text-xl font-bold">ログインを完了できませんでした</h1>
      <p className="text-sm text-muted-foreground">
        リンクの有効期限が切れているか、ログインを始めたブラウザとは別のブラウザで開いた可能性があります。
        もう一度ログイン画面からやり直してください。
      </p>
      <Button asChild>
        <Link href="/login">ログイン画面へ戻る</Link>
      </Button>
    </main>
  );
}

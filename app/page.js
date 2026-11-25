import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// shadcn/ui の部品が表示できるかを確かめるための、仮のトップページ。
// 第1回でタイムラインに作り替える。
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>shadcn/ui の準備ができました</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button>ボタン</Button>
          <Button variant="outline">アウトライン</Button>
        </CardContent>
      </Card>
    </main>
  );
}

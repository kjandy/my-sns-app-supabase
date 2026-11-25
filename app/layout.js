import { ClientLayout } from '@/components/ClientLayout';
import './globals.css';

// ここに書いた内容を、Next.js が <head> の <title> などに変換してくれる
export const metadata = {
  title: 'SNSアプリ（Supabase版）',
  description: '投稿・いいね・コメント・フォロー・DMができる学習用SNSアプリ',
};

export default function RootLayout({ children }) {
  // lang="ja"：このページは日本語だと宣言する（読み上げや翻訳の判定に使われる）
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

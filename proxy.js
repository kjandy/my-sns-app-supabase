/**
 * Next.js 16 の proxy（旧 middleware）。プロジェクト直下に置く。
 * すべてのページ表示の前に呼ばれる。
 *
 * Next.js 15 以前は middleware.js という名前で、関数名も middleware だった。
 */
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // 画像や静的ファイルには不要なので除外する
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

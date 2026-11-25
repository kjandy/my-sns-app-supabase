/**
 * OAuth（Google）とメール確認リンクの「戻り先」（app/auth/callback/route.js）
 *
 * 第5回の図の④：Supabase は ?code=xxxx を付けてここへ戻してくる。
 * この code を exchangeCodeForSession() でセッションに交換すると、
 * Cookie にセッションが保存され、ログイン完了になる（PKCEフロー）。
 *
 * Supabase公式ドキュメントの例をJavaScriptにしたもの。
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // ログイン後に戻したいページ（?next=/profile/xxx など）。
  // ★「/」で始まる相対パス以外は受け付けない。
  //   これを怠ると ?next=https://悪意のあるサイト で外部へ飛ばされる（オープンリダイレクト）。
  let next = searchParams.get('next') ?? '/';
  if (!next.startsWith('/') || next.startsWith('//')) next = '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Vercel などロードバランサーの裏では、元のホスト名が x-forwarded-host に入る
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) return NextResponse.redirect(`${origin}${next}`);
      if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${next}`);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // code が無い・交換に失敗した（期限切れ、別ブラウザで開いた など）
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

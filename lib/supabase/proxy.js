/**
 * セッション更新処理（lib/supabase/proxy.js）
 *
 * ルートの proxy.js から、ページを表示する前に毎回呼ばれる。
 *
 * ★なぜ必要か
 *   Supabase のアクセストークンは有効期限が短い（既定は1時間）。
 *   期限切れのトークンを「更新して Cookie に書き戻す」作業が必要だが、
 *   Server Component は Cookie を書き換えられない。そこで proxy が毎回先に済ませておく。
 *
 * 公式ドキュメントのコードをほぼそのまま使っている。
 * 「createServerClient と getClaims() の間に処理を書かない」
 * 「supabaseResponse をそのまま返す」の2点は崩さないこと。
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // ここで「トークンの検証＋必要なら更新」が行われる。消さないこと。
  await supabase.auth.getClaims();

  return supabaseResponse;
}

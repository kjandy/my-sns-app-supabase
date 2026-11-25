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
 * ★もう1つの仕事：ログインしていない人を /login へ送る（ページの入口の見張り）。
 *   ただし本当の守りはデータベースの RLS。proxy は「見た目の案内係」と考える。
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
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  // ログインしていなくても開けるページ
  const path = request.nextUrl.pathname;
  const isPublic = path.startsWith('/login') || path.startsWith('/auth');

  // 未ログインで保護ページを開いた → /login へ
  if (!isLoggedIn && !isPublic) return redirectTo(request, '/login', supabaseResponse);
  // ログイン済みで /login を開いた → トップへ
  if (isLoggedIn && path === '/login') return redirectTo(request, '/', supabaseResponse);

  return supabaseResponse;
}

// リダイレクトするときも、更新したCookieを引き継ぐ（引き継がないとログアウトされる）
function redirectTo(request, pathname, supabaseResponse) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  const response = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

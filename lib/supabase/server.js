/**
 * サーバー用のSupabaseクライアント（lib/supabase/server.js）
 *
 * Server Component / Server Action / Route Handler から使う。
 * リクエストに付いてきた Cookie を読み、「今アクセスしてきたのは誰か」を判定する。
 *
 * ★使うのは公開してよい publishable key だけ。
 *   「誰が何をできるか」は、キーではなくDB側のRLSで決まるため。
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component からは Cookie を書き込めないため、ここに来ることがある。
            // トークンの更新は proxy.js が毎リクエスト行っているので、無視してよい。
          }
        },
      },
    },
  );
}

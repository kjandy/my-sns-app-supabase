/**
 * ブラウザ用のSupabaseクライアント（lib/supabase/client.js）
 *
 * 'use client' のコンポーネントや Zustand ストアから使う。
 * セッションは localStorage ではなく Cookie に保存される（@supabase/ssr の仕様）。
 * → だからサーバー側（Server Component / proxy）からも同じログイン状態が見える。
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

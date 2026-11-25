-- =====================================================================
-- 0005_realtime.sql（第9回）Realtime を有効にする
--
-- supabase_realtime という「配信リスト（publication）」にテーブルを加えると、
-- そのテーブルの追加・削除がアプリへリアルタイムに届くようになる。
-- ダッシュボードの Database → Publications でも同じ設定ができる。
--
-- ★届くのは「その人が RLS で読める行」だけ（読めない行の変更は届かない）
-- =====================================================================
alter publication supabase_realtime add table public.posts, public.post_reactions, public.comments;

-- =====================================================================
-- 0008_dm_realtime.sql（第12回・発展）DM を Realtime の配信対象にする
--
-- messages     … 新しいメッセージがすぐ相手の画面に出る
-- conversations … 「最後のメッセージ」「既読」の変化が会話一覧・未読バッジに反映される
-- RLS により、届くのは会話の参加者だけ。
-- =====================================================================
alter publication supabase_realtime add table public.messages, public.conversations;

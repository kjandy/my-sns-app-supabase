-- =====================================================================
-- 0002_posts.sql（第6回）投稿
--
-- ① posts テーブル
-- ② RLS ＋ grant
-- ③ timeline_posts ビュー …… 投稿に「書いた人の名前・アイコン」をくっつけた表
-- =====================================================================

-- ① posts テーブル
--   user_id の default auth.uid() … insert のときに省略すると「ログイン中の人」が入る
--   名前やアイコンは保存しない。profiles とつなげて（JOIN して）表示する。
--   → プロフィールを変えると、過去の投稿の表示も新しい名前になる。
create table public.posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now(),
  constraint content_length check (char_length(trim(content)) between 1 and 280)
);

-- 新しい順に並べる・人ごとに絞る、をよく行うので索引（インデックス）を作っておく
create index posts_created_at_idx on public.posts (created_at desc, id desc);
create index posts_user_id_idx on public.posts (user_id, created_at desc);

-- ② RLS ＋ grant
alter table public.posts enable row level security;

create policy "ログイン済みなら読める"
  on public.posts for select to authenticated
  using (true);

create policy "自分の投稿だけ追加できる"
  on public.posts for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "自分の投稿だけ削除できる"
  on public.posts for delete to authenticated
  using (user_id = (select auth.uid()));

-- 投稿の編集（update）は作らない機能なので、ポリシーも grant も無し
grant select, insert, delete on public.posts to authenticated;

-- ③ timeline_posts ビュー
--   ビュー ＝「保存しておいた SELECT 文」。アプリからはテーブルと同じように読める。
--   security_invoker = true … ビューを読んだ人の権限で、元のテーブルの RLS が効く（必ず付ける）
--
--   like_count など件数の列は、いいね（第7回）・コメント（第8回）を作るまで 0 にしておき、
--   そのときにこのビューを作り直す。
create view public.timeline_posts
with (security_invoker = true)
as
select
  p.id,
  p.user_id,
  p.content,
  p.created_at,
  pr.display_name as user_name,
  pr.photo_url    as user_photo_url,
  0::bigint       as like_count,
  0::bigint       as bad_count,
  0::bigint       as comment_count,
  false           as liked_by_me,
  false           as bad_by_me
from public.posts p
join public.profiles pr on pr.id = p.user_id;

grant select on public.timeline_posts to authenticated;

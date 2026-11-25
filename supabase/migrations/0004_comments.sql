-- =====================================================================
-- 0004_comments.sql（第8回）コメント
--
-- ① comments テーブル
-- ② RLS ＋ grant
-- ③ comments_with_author ビュー（コメント＋書いた人の名前・アイコン）
-- ④ timeline_posts ビューを作り直して、コメント件数を数える
-- =====================================================================

-- ① on delete cascade … 投稿が削除されたら、その投稿へのコメントも自動で消える
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now(),
  constraint comment_length check (char_length(trim(content)) between 1 and 280)
);

create index comments_post_id_idx on public.comments (post_id, created_at);

-- ② RLS ＋ grant
alter table public.comments enable row level security;

create policy "ログイン済みなら読める"
  on public.comments for select to authenticated
  using (true);

create policy "自分のコメントだけ追加できる"
  on public.comments for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "自分のコメントだけ削除できる"
  on public.comments for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.comments to authenticated;

-- ③ コメント＋書いた人
create view public.comments_with_author
with (security_invoker = true)
as
select
  c.id,
  c.post_id,
  c.user_id,
  c.content,
  c.created_at,
  pr.display_name as user_name,
  pr.photo_url    as user_photo_url
from public.comments c
join public.profiles pr on pr.id = c.user_id;

grant select on public.comments_with_author to authenticated;

-- ④ 件数は「数えて出す」。数を別の列に保存しないので、ずれる心配がない
create or replace view public.timeline_posts
with (security_invoker = true)
as
select
  p.id,
  p.user_id,
  p.content,
  p.created_at,
  pr.display_name as user_name,
  pr.photo_url    as user_photo_url,
  (select count(*) from public.post_reactions r where r.post_id = p.id and r.kind = 'like') as like_count,
  (select count(*) from public.post_reactions r where r.post_id = p.id and r.kind = 'bad')  as bad_count,
  (select count(*) from public.comments c where c.post_id = p.id)                           as comment_count,
  exists (select 1 from public.post_reactions r
          where r.post_id = p.id and r.kind = 'like' and r.user_id = (select auth.uid())) as liked_by_me,
  exists (select 1 from public.post_reactions r
          where r.post_id = p.id and r.kind = 'bad' and r.user_id = (select auth.uid()))  as bad_by_me
from public.posts p
join public.profiles pr on pr.id = p.user_id;

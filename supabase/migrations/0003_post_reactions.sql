-- =====================================================================
-- 0003_post_reactions.sql（第7回）いいね・Bad
--
-- ① post_reactions テーブル …… 1行 ＝「誰が・どの投稿に・どちらを押したか」
-- ② RLS ＋ grant
-- ③ timeline_posts ビューを作り直して、件数と「自分が押したか」を計算する
-- =====================================================================

-- ① 主キーを (post_id, user_id, kind) の3つの組み合わせにする
--    → 同じ人が同じ投稿に2回「いいね」しようとしても、DB が拒否する
create table public.post_reactions (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('like', 'bad')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);

-- ② RLS ＋ grant
alter table public.post_reactions enable row level security;

create policy "ログイン済みなら読める"
  on public.post_reactions for select to authenticated
  using (true);

create policy "自分の分だけ追加できる"
  on public.post_reactions for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "自分の分だけ取り消せる"
  on public.post_reactions for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.post_reactions to authenticated;

-- ③ ビューを作り直す（列の名前・順番・型は第6回と同じにしておく）
--    (select count(*) ...) … その投稿のいいねの件数を数える「サブクエリ」
--    exists (...)          … 自分が押した行が1つでもあれば true
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
  0::bigint as comment_count,
  exists (select 1 from public.post_reactions r
          where r.post_id = p.id and r.kind = 'like' and r.user_id = (select auth.uid())) as liked_by_me,
  exists (select 1 from public.post_reactions r
          where r.post_id = p.id and r.kind = 'bad' and r.user_id = (select auth.uid()))  as bad_by_me
from public.posts p
join public.profiles pr on pr.id = p.user_id;

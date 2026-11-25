-- =====================================================================
-- 0006_follows.sql（第10回）フォロー
--
-- follows テーブル：1行 ＝「follower（フォローする人）が followee（される人）をフォローしている」
-- 多対多（たくさんの人が、たくさんの人をフォローする）は、このように「つなぐ表」で表す。
-- =====================================================================
create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),        -- 同じ人を2回フォローできない
  constraint no_self_follow check (follower_id <> followee_id)  -- 自分はフォローできない
);

-- 「この人のフォロワー」を数えるときに使う索引
create index follows_followee_idx on public.follows (followee_id);

alter table public.follows enable row level security;

create policy "ログイン済みなら読める"
  on public.follows for select to authenticated
  using (true);

create policy "自分のフォローだけ追加できる"
  on public.follows for insert to authenticated
  with check (follower_id = (select auth.uid()));

create policy "自分のフォローだけ解除できる"
  on public.follows for delete to authenticated
  using (follower_id = (select auth.uid()));

grant select, insert, delete on public.follows to authenticated;

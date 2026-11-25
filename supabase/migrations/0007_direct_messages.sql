-- =====================================================================
-- 0007_direct_messages.sql（第11回・発展）DM（ダイレクトメッセージ）
--
-- ① conversations …… 2人の会話（1組につき1行）
-- ② messages ………… 会話の中の1通1通
-- ③ RLS ＋ grant …… 「参加している2人だけ」が読み書きできる
-- ④ 関数（RPC）……… 会話を作る／既読にする（ルールが複雑なので DB の関数にまとめる）
-- ⑤ トリガー ……… メッセージが届いたら、会話の「最後のメッセージ」を更新する
-- ⑥ conversation_list ビュー …… 会話一覧（相手の名前・未読かどうか付き）
-- =====================================================================

-- ① conversations
--   user_a と user_b は「小さい方の id を user_a」と決めておく（check 制約）。
--   → 同じ2人の会話が、AとBの順番違いで2つできてしまうのを防げる（unique 制約）
create table public.conversations (
  id               uuid primary key default gen_random_uuid(),
  user_a           uuid not null references public.profiles (id) on delete cascade,
  user_b           uuid not null references public.profiles (id) on delete cascade,
  last_message     text,
  last_message_at  timestamptz,
  last_sender_id   uuid,
  last_read_at_a   timestamptz,  -- user_a が最後に読んだ時刻（null ＝ まだ一度も読んでいない）
  last_read_at_b   timestamptz,  -- user_b が最後に読んだ時刻
  created_at       timestamptz not null default now(),
  constraint ordered_pair check (user_a < user_b),
  constraint unique_pair unique (user_a, user_b)
);

-- ② messages
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  content         text not null,
  created_at      timestamptz not null default now(),
  constraint message_length check (char_length(trim(content)) between 1 and 1000)
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- ③ RLS ＋ grant
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- 会話：自分が参加している行だけ読める（追加・更新は ④⑤ の関数だけが行う）
create policy "参加者だけ読める"
  on public.conversations for select to authenticated
  using ((select auth.uid()) in (user_a, user_b));

-- 「この会話に自分が参加しているか」を確かめる関数（ポリシーの中で使う）
--   security definer にしておくと、ポリシーの中から conversations を読んでも
--   RLS が二重にかからず、シンプルに判定できる
create function public.is_conversation_member(conv_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = conv_id and (select auth.uid()) in (c.user_a, c.user_b)
  );
$$;

create policy "参加者だけ読める"
  on public.messages for select to authenticated
  using (public.is_conversation_member(conversation_id));

create policy "参加者が自分の名前でだけ送れる"
  on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.is_conversation_member(conversation_id));

grant select on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;

-- ④-1 会話を取得（無ければ作る）。戻り値は会話の id
--   アプリからは supabase.rpc('get_or_create_conversation', { other_user: '...' }) で呼ぶ
create function public.get_or_create_conversation(other_user uuid)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  a uuid := least(me, other_user);
  b uuid := greatest(me, other_user);
  conv_id uuid;
begin
  if me is null then raise exception 'ログインが必要です'; end if;
  if other_user = me then raise exception '自分自身とは会話できません'; end if;

  insert into public.conversations (user_a, user_b)
  values (a, b)
  on conflict (user_a, user_b) do nothing;   -- すでにあれば何もしない

  select id into conv_id from public.conversations where user_a = a and user_b = b;
  return conv_id;
end;
$$;

-- ④-2 既読にする（自分の側の「最後に読んだ時刻」を今にする）
create function public.mark_conversation_read(conv_id uuid)
returns void
language sql
security definer set search_path = ''
as $$
  update public.conversations
  set last_read_at_a = case when user_a = (select auth.uid()) then now() else last_read_at_a end,
      last_read_at_b = case when user_b = (select auth.uid()) then now() else last_read_at_b end
  where id = conv_id and (select auth.uid()) in (user_a, user_b);
$$;

-- 関数はまず全員から実行権限を外し、ログイン済みの人にだけ与える
revoke execute on function public.get_or_create_conversation(uuid) from public, anon;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
revoke execute on function public.is_conversation_member(uuid) from public, anon;
grant execute on function public.get_or_create_conversation(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.is_conversation_member(uuid) to authenticated;

-- ⑤ メッセージが追加されたら、会話の「最後のメッセージ」を更新する
--   送った本人は、その時点で既読扱いにする
create function public.handle_new_message()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.conversations
  set last_message    = left(new.content, 100),
      last_message_at = new.created_at,
      last_sender_id  = new.sender_id,
      last_read_at_a  = case when user_a = new.sender_id then new.created_at else last_read_at_a end,
      last_read_at_b  = case when user_b = new.sender_id then new.created_at else last_read_at_b end
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_created
  after insert on public.messages
  for each row execute procedure public.handle_new_message();

-- ⑥ 会話一覧ビュー（ログイン中の人から見た「相手」と「未読かどうか」）
create view public.conversation_list
with (security_invoker = true)
as
select
  c.id,
  other.id           as other_user_id,
  other.display_name as other_name,
  other.photo_url    as other_photo_url,
  c.last_message,
  c.last_message_at,
  c.last_sender_id,
  -- 未読 ＝ 最後のメッセージが相手から来ていて、自分が最後に読んだ時刻より新しい
  (
    c.last_message_at is not null
    and c.last_sender_id <> (select auth.uid())
    -- coalesce(x, '-infinity') … まだ読んだことが無い（null）なら「大昔」として比べる
    and c.last_message_at > coalesce(
      case when c.user_a = (select auth.uid()) then c.last_read_at_a else c.last_read_at_b end,
      '-infinity'
    )
  ) as unread
from public.conversations c
join public.profiles other
  on other.id = case when c.user_a = (select auth.uid()) then c.user_b else c.user_a end;

grant select on public.conversation_list to authenticated;

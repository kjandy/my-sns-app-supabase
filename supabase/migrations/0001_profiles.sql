-- =====================================================================
-- 0001_profiles.sql（第4回）
-- Supabase ダッシュボード → SQL Editor に貼り付けて「Run」する
--
-- ① profiles テーブル …… ユーザーの公開プロフィール（表示名・アイコンなど）
-- ② RLS ……………………… 「誰がどの行を読める／書けるか」のルール
-- ③ grant …………………… アプリ（Data API）からこのテーブルを使えるようにする
-- ④ トリガー ………………… ユーザー登録の瞬間に profiles を自動で作る
-- =====================================================================

-- ---------------------------------------------------------------------
-- ① profiles テーブル
--   id は auth.users（Supabase が管理するユーザー表）の id と同じ値。
--   on delete cascade … ユーザーが削除されたら、プロフィールも一緒に消える。
-- ---------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  photo_url    text,
  bio          text not null default '',
  location     text not null default '',
  banner_url   text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- check 制約：ルールに合わない値はデータベースが受け付けない
  constraint display_name_length check (char_length(display_name) between 1 and 50),
  constraint bio_length check (char_length(bio) <= 160),
  constraint location_length check (char_length(location) <= 30)
);

-- ---------------------------------------------------------------------
-- ② RLS（行レベルセキュリティ）
--   enable にした瞬間、「ポリシーで許可したこと」以外はすべて拒否になる。
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

-- ログインしていれば、誰のプロフィールでも読める（SNSなので）
create policy "ログイン済みなら読める"
  on public.profiles for select
  to authenticated
  using (true);

-- 自分の行だけ更新できる
--   using      … 更新「前」の行が自分のものか
--   with check … 更新「後」の行も自分のものか（id を他人のものに書き換えるのを防ぐ）
create policy "自分の行だけ更新できる"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- insert と delete のポリシーは「あえて作らない」
--   insert … ④のトリガーだけが行う
--   delete … ユーザーの削除に連動して cascade で消える

-- ---------------------------------------------------------------------
-- ③ grant（Data API への公開）
--   新しいプロジェクトでは、テーブルを作っただけではアプリから見えない。
--   grant が「窓口を開ける」、RLS が「どの行を見せるか」。両方そろって初めて使える。
-- ---------------------------------------------------------------------
grant select, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- ④ 新規登録トリガー
--   auth.users に1行増えたら（メール登録でも Google でも）、profiles に1行作る。
--   raw_user_meta_data に入っている値
--     メール登録 … signUp の options.data で渡した { full_name }
--     Google     … Google が返す full_name / name / avatar_url / picture など
--
--   security definer      … この関数は作成者（管理者）の権限で動く。
--                           RLS で insert を許可していなくても profiles に書き込める。
--   set search_path = ''  … 関数内のテーブルは public.xxx と完全な名前で書く（安全のための定石）
-- ---------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, photo_url)
  values (
    new.id,
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
        split_part(new.email, '@', 1)        -- 名前が無ければメールの@より前
      ),
      50
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- （おまけ）updated_at を自動で更新する。以降のテーブルでも使い回す。
-- ---------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

# 第7回 いいね・Bad（post_reactions）

> 開始タグ：`lesson06-step3` → 到達タグ：`lesson07-step2`

## この回のゴール

- 「誰が・どの投稿に・どちらを押したか」を1行で表すテーブルを設計できる
- **複合主キー** で「同じ人が2回押せない」をデータベースに守らせる
- ビューで件数（`count`）と「自分が押したか」（`exists`）を計算する

## 講義

### 1. 件数を「列」に持たない

| 方法 | 例 | 問題 |
|---|---|---|
| ❌ `posts.like_count` を +1 / -1 する | 2人が同時に押すと数がずれる・誰が押したか分からない | |
| ✅ 押した記録を1行ずつ保存し、**数えて** 表示する | `post_reactions` に1行足す・消す | ずれない。誰が押したかも分かる |

```text
post_reactions
| post_id | user_id | kind |
|---------|---------|------|
| p1      | 安堂    | like |   ← 主キー＝3つの組み合わせ
| p1      | 佐藤    | like |
| p1      | 佐藤    | bad  |   ← 同じ人でも kind が違えば別の行
```

### 2. ビューで数える

```sql
(select count(*) from public.post_reactions r where r.post_id = p.id and r.kind = 'like') as like_count,
exists (select 1 from public.post_reactions r
        where r.post_id = p.id and r.kind = 'like' and r.user_id = (select auth.uid())) as liked_by_me
```

- `auth.uid()` は「ビューを読んでいる人」。だから `liked_by_me` は人によって違う値になる

---

## Step 1：post_reactions テーブルとビューの件数計算

`supabase/migrations/0003_post_reactions.sql` を作り、SQL Editor で実行します。
ビューは `create or replace view` で **作り直し** ます（列の数と順番は第6回と同じなので、置き換えられます）。

#### 📄 `supabase/migrations/0003_post_reactions.sql`（新規）

```sql
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
```


✅ **動作確認**（SQL Editor）

```sql
-- 同じ組み合わせを2回入れると、2回目は主キーの重複エラー（duplicate key）になる
insert into public.post_reactions (post_id, user_id, kind)
select id, user_id, 'like' from public.posts limit 1;
insert into public.post_reactions (post_id, user_id, kind)
select id, user_id, 'like' from public.posts limit 1;
```

- 1回目は成功、2回目は `duplicate key value violates unique constraint` になる
- `select like_count from public.timeline_posts;` で 1 になっている投稿がある
- 試した行は Table Editor で消しておく

💾 **コミット**

```bash
git add -A
git commit -m "[第7回 Step1] いいね・Bad用の post_reactions テーブルとビューの件数計算を追加"
```

---

## Step 2：いいね・Bad を Supabase に切り替える

- `stores/postStore.js`
  - `toggleReaction(post, kind, myUid)`：押していなければ insert、押していれば delete
  - エラーコード `23505`（主キーの重複＝連打）は「すでに押してある」ので無視する
  - `_refreshPost(postId)`：その投稿1件をビューから読み直し、一覧・詳細・プロフィールの表示を更新する
- 画面のコードは変更なし（関数の名前と引数が同じだから）

#### ✏️ `stores/postStore.js`（変更）

`+` の行を追加し、`-` の行を削除します。

```diff
@@ -2,8 +2,9 @@
  * 投稿・リアクション・コメントのストア（stores/postStore.js）
  *
  * 第6回：投稿（読み込み・作成・削除）を Supabase に切り替えた。
- *   読むときは timeline_posts ビュー（投稿＋書いた人の名前・アイコン）を使う。
- * いいね・Bad（第7回）とコメント（第8回）は、まだメモリ上のニセのデータベース。
+ *   読むときは timeline_posts ビュー（投稿＋書いた人の名前・アイコン＋件数）を使う。
+ * 第7回：いいね・Bad を post_reactions テーブルに切り替えた。
+ * コメント（第8回）は、まだメモリ上のニセのデータベース。
  *
  * ★関数の名前と引数は第3回から変えていない → 画面のコードはほぼそのまま動く。
  */
@@ -28,21 +29,13 @@ const toPost = (row) => ({
   badByMe: row.bad_by_me,
 });
 
-// ---- いいね・コメントは第7・8回まで、メモリ上のニセのデータベース --------------
-const mockDb = { reactions: [], comments: [] };
+// ---- コメントは第8回まで、メモリ上のニセのデータベース ----------------------
+const mockDb = { comments: [] };
 let nextId = 1000;
-const withMockCounts = (post, myUid) => {
-  const rs = mockDb.reactions.filter((r) => r.postId === post.id);
-  const mine = (kind) => rs.some((r) => r.userId === myUid && r.kind === kind);
-  return {
-    ...post,
-    likeCount: post.likeCount + rs.filter((r) => r.kind === 'like').length,
-    badCount: post.badCount + rs.filter((r) => r.kind === 'bad').length,
-    commentCount: post.commentCount + mockDb.comments.filter((c) => c.postId === post.id).length,
-    likedByMe: post.likedByMe || mine('like'),
-    badByMe: post.badByMe || mine('bad'),
-  };
-};
+const withMockCounts = (post) => ({
+  ...post,
+  commentCount: post.commentCount + mockDb.comments.filter((c) => c.postId === post.id).length,
+});
 
 // タイムラインの問い合わせを組み立てる。before を渡すと「その時刻より古いもの」だけにする
 const buildTimelineQuery = ({ mode, userIds }, before) => {
@@ -80,14 +73,14 @@ const usePostStore = create((set, get) => ({
     if (error) console.error('fetchTimeline', error.message);
     const rows = data ?? [];
     set({
-      timeline: rows.map(toPost).map((p) => withMockCounts(p, myUid)),
+      timeline: rows.map(toPost).map(withMockCounts),
       timelineHasMore: rows.length === PAGE_SIZE, // ちょうど満タンなら続きがあるかもしれない
       timelineLoading: false,
     });
   },
   // 続きを読む：今表示している最後の投稿より「古い」ものを PAGE_SIZE 件
   loadMoreTimeline: async () => {
-    const { timeline, timelineQuery, timelineLoading, timelineHasMore, myUid } = get();
+    const { timeline, timelineQuery, timelineLoading, timelineHasMore } = get();
     if (timelineLoading || !timelineHasMore || !timelineQuery) return;
     set({ timelineLoading: true });
     const last = timeline[timeline.length - 1];
@@ -95,7 +88,7 @@ const usePostStore = create((set, get) => ({
     if (error) console.error('loadMoreTimeline', error.message);
     const rows = data ?? [];
     set({
-      timeline: [...timeline, ...rows.map(toPost).map((p) => withMockCounts(p, myUid))],
+      timeline: [...timeline, ...rows.map(toPost).map(withMockCounts)],
       timelineHasMore: rows.length === PAGE_SIZE,
       timelineLoading: false,
     });
@@ -104,7 +97,7 @@ const usePostStore = create((set, get) => ({
     set({ currentPostLoading: true, currentPostId: postId });
     const { data, error } = await supabase.from('timeline_posts').select('*').eq('id', postId).maybeSingle();
     if (error) console.error('fetchPost', error.message); // 例：id の形式が不正
-    set({ currentPost: data ? withMockCounts(toPost(data), myUid) : null, currentPostLoading: false, myUid });
+    set({ currentPost: data ? withMockCounts(toPost(data)) : null, currentPostLoading: false, myUid });
   },
   fetchUserPosts: async (uid, myUid) => {
     const { data, error } = await supabase
@@ -113,7 +106,7 @@ const usePostStore = create((set, get) => ({
       .eq('user_id', uid)
       .order('created_at', { ascending: false });
     if (error) console.error('fetchUserPosts', error.message);
-    set({ userPosts: (data ?? []).map(toPost).map((p) => withMockCounts(p, myUid)), myUid });
+    set({ userPosts: (data ?? []).map(toPost).map(withMockCounts), myUid });
   },
   fetchComments: async (postId) => {
     set({ comments: mockDb.comments.filter((c) => c.postId === postId) });
@@ -137,13 +130,16 @@ const usePostStore = create((set, get) => ({
       currentPost: get().currentPost?.id === postId ? null : get().currentPost,
     });
   },
-  // いいね・Bad（第7回で Supabase に切り替える）
+  // いいね・Bad の切り替え（kind: 'like' | 'bad'）
+  //   押していなければ1行追加、押していればその行を削除する
   toggleReaction: async (post, kind, myUid) => {
-    const mine = (r) => r.postId === post.id && r.userId === myUid && r.kind === kind;
-    mockDb.reactions = mockDb.reactions.some(mine)
-      ? mockDb.reactions.filter((r) => !mine(r))
-      : [...mockDb.reactions, { postId: post.id, userId: myUid, kind }];
-    get()._refreshPost(post, myUid);
+    const already = kind === 'like' ? post.likedByMe : post.badByMe;
+    const { error } = already
+      ? await supabase.from('post_reactions').delete().match({ post_id: post.id, user_id: myUid, kind })
+      : await supabase.from('post_reactions').insert({ post_id: post.id, kind });
+    // 23505 … 主キーの重複（連打して2回追加しようとした）。すでに押してあるので無視してよい
+    if (error && error.code !== '23505') console.error('toggleReaction', error.message);
+    await get()._refreshPost(post.id);
   },
   // コメント（第8回で Supabase に切り替える）
   addComment: async ({ postId, content, user }) => {
@@ -157,23 +153,24 @@ const usePostStore = create((set, get) => ({
       createdAt: new Date().toISOString(),
     });
     await get().fetchComments(postId);
-    if (get().currentPost) get()._refreshPost(get().currentPost, user.uid);
+    await get()._refreshPost(postId);
   },
   deleteComment: async (comment, myUid) => {
     mockDb.comments = mockDb.comments.filter((c) => c.id !== comment.id);
     await get().fetchComments(comment.postId);
-    if (get().currentPost) get()._refreshPost(get().currentPost, myUid);
+    await get()._refreshPost(comment.postId);
   },
 
-  // 1件の投稿の件数表示を、表示中のすべての一覧で最新にする（ニセのDB用）
-  _refreshPost: (post, myUid) => {
-    const base = { ...post, likeCount: 0, badCount: 0, commentCount: 0, likedByMe: false, badByMe: false };
-    const fresh = withMockCounts(base, myUid);
-    const replace = (list) => list.map((p) => (p.id === post.id ? fresh : p));
+  // 1件の投稿をビューから読み直し、表示中のすべての一覧で差し替える（件数を最新にする）
+  _refreshPost: async (postId) => {
+    const { data } = await supabase.from('timeline_posts').select('*').eq('id', postId).maybeSingle();
+    if (!data) return;
+    const fresh = withMockCounts(toPost(data));
+    const replace = (list) => list.map((p) => (p.id === postId ? fresh : p));
     set({
       timeline: replace(get().timeline),
       userPosts: replace(get().userPosts),
-      currentPost: get().currentPost?.id === post.id ? fresh : get().currentPost,
+      currentPost: get().currentPost?.id === postId ? fresh : get().currentPost,
     });
   },
 }));
```


✅ **動作確認**

| # | 操作 | 期待する結果 |
|---|---|---|
| 1 | いいねを押す → 再読み込み | 数と色が残っている |
| 2 | もう一度押す | 取り消される |
| 3 | 別のアカウントで同じ投稿にいいね | 数が2になる。自分の画面では、再読み込みすると2になる（すぐ反映は第9回） |
| 4 | Table Editor → `post_reactions` | 押した分だけ行がある |
| 5 | 投稿を削除する | その投稿の `post_reactions` の行も消える（`on delete cascade`） |

💾 **コミット**

```bash
git add -A
git commit -m "[第7回 Step2] いいね・Bad を Supabase の post_reactions テーブルに切り替える"
```

---

## 確認クイズ

1. 主キーを `(post_id, user_id, kind)` にすると、何が守られる？ → 同じ人が同じ投稿に同じ種類を2回押せない
2. `liked_by_me` が人によって違う値になるのはなぜ？ → ビューの中の `auth.uid()` が「読んでいる人」になるから

## よくあるつまずき

| 症状 | 原因 | 対処 |
|---|---|---|
| `cannot change name of view column` | ビューの列の順番・名前を変えてしまった | 完成形と同じ列の順番にする |
| 押しても数が変わらない | `_refreshPost` を呼んでいない／ビューを作り直していない | Step 1 の SQL の③を実行したか確認 |
| 数が `"3"` のように文字で表示される | `count` は bigint で、文字列で届くことがある | `toPost` の `Number(...)` を確認 |

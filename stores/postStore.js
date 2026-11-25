/**
 * 投稿・リアクション・コメントのストア（stores/postStore.js）
 *
 * 第6回：投稿（読み込み・作成・削除）を Supabase に切り替えた。
 *   読むときは timeline_posts ビュー（投稿＋書いた人の名前・アイコン）を使う。
 * いいね・Bad（第7回）とコメント（第8回）は、まだメモリ上のニセのデータベース。
 *
 * ★関数の名前と引数は第3回から変えていない → 画面のコードはほぼそのまま動く。
 */
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const PAGE_SIZE = 10; // 1回に読み込む件数

// ビューの1行（snake_case）→ アプリで使う投稿の形（camelCase）
const toPost = (row) => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name,
  userPhotoURL: row.user_photo_url,
  content: row.content,
  createdAt: row.created_at,
  likeCount: Number(row.like_count), // bigint は文字列で届くことがあるので数値にそろえる
  badCount: Number(row.bad_count),
  commentCount: Number(row.comment_count),
  likedByMe: row.liked_by_me,
  badByMe: row.bad_by_me,
});

// ---- いいね・コメントは第7・8回まで、メモリ上のニセのデータベース --------------
const mockDb = { reactions: [], comments: [] };
let nextId = 1000;
const withMockCounts = (post, myUid) => {
  const rs = mockDb.reactions.filter((r) => r.postId === post.id);
  const mine = (kind) => rs.some((r) => r.userId === myUid && r.kind === kind);
  return {
    ...post,
    likeCount: post.likeCount + rs.filter((r) => r.kind === 'like').length,
    badCount: post.badCount + rs.filter((r) => r.kind === 'bad').length,
    commentCount: post.commentCount + mockDb.comments.filter((c) => c.postId === post.id).length,
    likedByMe: post.likedByMe || mine('like'),
    badByMe: post.badByMe || mine('bad'),
  };
};

// タイムラインの問い合わせを組み立てる。before を渡すと「その時刻より古いもの」だけにする
const buildTimelineQuery = ({ mode, userIds }, before) => {
  let query = supabase
    .from('timeline_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);
  if (mode === 'following') query = query.in('user_id', userIds);
  if (before) query = query.lt('created_at', before);
  return query;
};

// ---- ストア ---------------------------------------------------------------
const usePostStore = create((set, get) => ({
  // --- State ---
  timeline: [],
  timelineLoading: false,
  timelineHasMore: false, // まだ続きがあるか（無限スクロール用）
  timelineQuery: null, // 続きを読むときに同じ条件を使うため、最後の条件を覚えておく
  currentPost: null, // 投稿詳細ページで表示中の投稿（見つからなければ null）
  currentPostLoading: false,
  currentPostId: null, // どの投稿を読み込んだ（読み込み中）か
  userPosts: [], // プロフィールページで表示中の人の投稿
  comments: [], // 投稿詳細ページで表示中のコメント
  myUid: null,

  // --- 読み込み ---
  // mode: 'public'（全員）/ 'following'（userIds に含まれる人だけ）
  //   最初の PAGE_SIZE 件だけ読み、続きは loadMoreTimeline() で読む
  fetchTimeline: async ({ mode, myUid, userIds = [] }) => {
    const timelineQuery = { mode, userIds };
    set({ timelineLoading: true, timelineQuery, myUid });
    const { data, error } = await buildTimelineQuery(timelineQuery);
    if (error) console.error('fetchTimeline', error.message);
    const rows = data ?? [];
    set({
      timeline: rows.map(toPost).map((p) => withMockCounts(p, myUid)),
      timelineHasMore: rows.length === PAGE_SIZE, // ちょうど満タンなら続きがあるかもしれない
      timelineLoading: false,
    });
  },
  // 続きを読む：今表示している最後の投稿より「古い」ものを PAGE_SIZE 件
  loadMoreTimeline: async () => {
    const { timeline, timelineQuery, timelineLoading, timelineHasMore, myUid } = get();
    if (timelineLoading || !timelineHasMore || !timelineQuery) return;
    set({ timelineLoading: true });
    const last = timeline[timeline.length - 1];
    const { data, error } = await buildTimelineQuery(timelineQuery, last?.createdAt);
    if (error) console.error('loadMoreTimeline', error.message);
    const rows = data ?? [];
    set({
      timeline: [...timeline, ...rows.map(toPost).map((p) => withMockCounts(p, myUid))],
      timelineHasMore: rows.length === PAGE_SIZE,
      timelineLoading: false,
    });
  },
  fetchPost: async (postId, myUid) => {
    set({ currentPostLoading: true, currentPostId: postId });
    const { data, error } = await supabase.from('timeline_posts').select('*').eq('id', postId).maybeSingle();
    if (error) console.error('fetchPost', error.message); // 例：id の形式が不正
    set({ currentPost: data ? withMockCounts(toPost(data), myUid) : null, currentPostLoading: false, myUid });
  },
  fetchUserPosts: async (uid, myUid) => {
    const { data, error } = await supabase
      .from('timeline_posts')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) console.error('fetchUserPosts', error.message);
    set({ userPosts: (data ?? []).map(toPost).map((p) => withMockCounts(p, myUid)), myUid });
  },
  fetchComments: async (postId) => {
    set({ comments: mockDb.comments.filter((c) => c.postId === postId) });
  },

  // --- 書き込み ---
  createPost: async ({ content }) => {
    // user_id は書かない（DB の default auth.uid() が入る。RLS でも自分以外は拒否される）
    const { data, error } = await supabase.from('posts').insert({ content }).select('id').single();
    if (error) throw new Error(`投稿に失敗しました：${error.message}`);
    // 名前・アイコン付きの形で読み直して、一覧の先頭に足す
    const { data: row } = await supabase.from('timeline_posts').select('*').eq('id', data.id).single();
    if (row) set({ timeline: [toPost(row), ...get().timeline] });
  },
  deletePost: async (postId) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw new Error(`削除に失敗しました：${error.message}`);
    set({
      timeline: get().timeline.filter((p) => p.id !== postId),
      userPosts: get().userPosts.filter((p) => p.id !== postId),
      currentPost: get().currentPost?.id === postId ? null : get().currentPost,
    });
  },
  // いいね・Bad（第7回で Supabase に切り替える）
  toggleReaction: async (post, kind, myUid) => {
    const mine = (r) => r.postId === post.id && r.userId === myUid && r.kind === kind;
    mockDb.reactions = mockDb.reactions.some(mine)
      ? mockDb.reactions.filter((r) => !mine(r))
      : [...mockDb.reactions, { postId: post.id, userId: myUid, kind }];
    get()._refreshPost(post, myUid);
  },
  // コメント（第8回で Supabase に切り替える）
  addComment: async ({ postId, content, user }) => {
    mockDb.comments.push({
      id: `c${nextId++}`,
      postId,
      userId: user.uid,
      userName: user.displayName,
      userPhotoURL: user.photoURL,
      content,
      createdAt: new Date().toISOString(),
    });
    await get().fetchComments(postId);
    if (get().currentPost) get()._refreshPost(get().currentPost, user.uid);
  },
  deleteComment: async (comment, myUid) => {
    mockDb.comments = mockDb.comments.filter((c) => c.id !== comment.id);
    await get().fetchComments(comment.postId);
    if (get().currentPost) get()._refreshPost(get().currentPost, myUid);
  },

  // 1件の投稿の件数表示を、表示中のすべての一覧で最新にする（ニセのDB用）
  _refreshPost: (post, myUid) => {
    const base = { ...post, likeCount: 0, badCount: 0, commentCount: 0, likedByMe: false, badByMe: false };
    const fresh = withMockCounts(base, myUid);
    const replace = (list) => list.map((p) => (p.id === post.id ? fresh : p));
    set({
      timeline: replace(get().timeline),
      userPosts: replace(get().userPosts),
      currentPost: get().currentPost?.id === post.id ? fresh : get().currentPost,
    });
  },
}));

export default usePostStore;

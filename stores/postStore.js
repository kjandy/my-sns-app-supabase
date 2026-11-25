/**
 * 投稿・リアクション・コメントのストア（stores/postStore.js）— 第3回：モック版
 *
 * 画面はこのストアの関数（fetchTimeline / createPost / toggleReaction …）を呼ぶだけ。
 * 第3回は、ブラウザのメモリ上にある「ニセのデータベース（mockDb）」を読み書きする。
 * 第6〜8回で中身を Supabase に差し替えるが、関数の名前と引数は変えない。
 *
 * ★ページを再読み込みすると mockDb は最初の状態に戻る（保存先がメモリだから）。
 *   「データベースが必要な理由」を体感するポイント。
 */
import { create } from 'zustand';
import { dummyComments, dummyPosts } from '@/lib/dummyData';

// ---- ニセのデータベース ----------------------------------------------------
// dummyPosts の likedByMe / badByMe は「u1 が押している」という意味にしておく
const mockDb = {
  posts: dummyPosts.map(({ likedByMe, badByMe, ...p }) => ({
    ...p,
    likeCount: p.likeCount - (likedByMe ? 1 : 0), // u1 以外の人の分
    badCount: p.badCount - (badByMe ? 1 : 0),
  })),
  reactions: dummyPosts.flatMap((p) => [
    ...(p.likedByMe ? [{ postId: p.id, userId: 'u1', kind: 'like' }] : []),
    ...(p.badByMe ? [{ postId: p.id, userId: 'u1', kind: 'bad' }] : []),
  ]),
  comments: [...dummyComments],
};
let nextId = 1000;

// 投稿に「件数」と「自分が押しているか」を付け足す（第6回以降は DB のビューが計算する）
const withCounts = (post, myUid) => {
  const rs = mockDb.reactions.filter((r) => r.postId === post.id);
  const mine = (kind) => rs.some((r) => r.userId === myUid && r.kind === kind);
  return {
    ...post,
    likeCount: post.likeCount + rs.filter((r) => r.kind === 'like').length,
    badCount: post.badCount + rs.filter((r) => r.kind === 'bad').length,
    commentCount: mockDb.comments.filter((c) => c.postId === post.id).length,
    likedByMe: mine('like'),
    badByMe: mine('bad'),
  };
};
const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

// ---- ストア ---------------------------------------------------------------
const usePostStore = create((set, get) => ({
  // --- State ---
  timeline: [],
  timelineLoading: false,
  currentPost: null, // 投稿詳細ページで表示中の投稿
  userPosts: [], // プロフィールページで表示中の人の投稿
  comments: [], // 投稿詳細ページで表示中のコメント
  myUid: null, // 「自分が押しているか」の判定に使う

  // --- 読み込み ---
  // mode: 'public'（全員）/ 'following'（userIds に含まれる人だけ）
  fetchTimeline: async ({ mode, myUid, userIds = [] }) => {
    const posts = mockDb.posts
      .filter((p) => mode === 'public' || userIds.includes(p.userId))
      .sort(byNewest)
      .map((p) => withCounts(p, myUid));
    set({ timeline: posts, timelineLoading: false, myUid });
  },
  fetchPost: async (postId, myUid) => {
    const post = mockDb.posts.find((p) => p.id === postId);
    set({ currentPost: post ? withCounts(post, myUid) : null, myUid });
  },
  fetchUserPosts: async (uid, myUid) => {
    const posts = mockDb.posts.filter((p) => p.userId === uid).sort(byNewest).map((p) => withCounts(p, myUid));
    set({ userPosts: posts, myUid });
  },
  fetchComments: async (postId) => {
    const comments = mockDb.comments
      .filter((c) => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    set({ comments });
  },

  // --- 書き込み ---
  createPost: async ({ content, user }) => {
    const post = {
      id: `p${nextId++}`,
      userId: user.uid,
      userName: user.displayName, // ★名前を「コピー」して保存している（第6回で問題になる）
      userPhotoURL: user.photoURL,
      content,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      badCount: 0,
    };
    mockDb.posts.push(post);
    set({ timeline: [withCounts(post, user.uid), ...get().timeline] });
  },
  deletePost: async (postId) => {
    mockDb.posts = mockDb.posts.filter((p) => p.id !== postId);
    mockDb.comments = mockDb.comments.filter((c) => c.postId !== postId); // コメントも一緒に消す
    mockDb.reactions = mockDb.reactions.filter((r) => r.postId !== postId);
    set({
      timeline: get().timeline.filter((p) => p.id !== postId),
      userPosts: get().userPosts.filter((p) => p.id !== postId),
      currentPost: get().currentPost?.id === postId ? null : get().currentPost,
    });
  },
  // kind: 'like' | 'bad'。押していなければ追加、押していれば取り消す（トグル）
  toggleReaction: async (post, kind, myUid) => {
    const exists = mockDb.reactions.some((r) => r.postId === post.id && r.userId === myUid && r.kind === kind);
    mockDb.reactions = exists
      ? mockDb.reactions.filter((r) => !(r.postId === post.id && r.userId === myUid && r.kind === kind))
      : [...mockDb.reactions, { postId: post.id, userId: myUid, kind }];
    get()._refreshPost(post.id, myUid);
  },
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
    get()._refreshPost(postId, user.uid);
  },
  deleteComment: async (comment, myUid) => {
    mockDb.comments = mockDb.comments.filter((c) => c.id !== comment.id);
    await get().fetchComments(comment.postId);
    get()._refreshPost(comment.postId, myUid);
  },

  // 1件の投稿の表示（件数など）を、表示中のすべての一覧で最新にする
  _refreshPost: (postId, myUid) => {
    const raw = mockDb.posts.find((p) => p.id === postId);
    if (!raw) return;
    const fresh = withCounts(raw, myUid);
    const replace = (list) => list.map((p) => (p.id === postId ? fresh : p));
    set({
      timeline: replace(get().timeline),
      userPosts: replace(get().userPosts),
      currentPost: get().currentPost?.id === postId ? fresh : get().currentPost,
    });
  },
}));

export default usePostStore;

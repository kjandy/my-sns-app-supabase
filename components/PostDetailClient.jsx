'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CommentForm } from '@/components/CommentForm';
import { CommentRow } from '@/components/CommentRow';
import { PageHeader } from '@/components/PageHeader';
import { PostRow } from '@/components/PostRow';
import useAuthStore from '@/stores/authStore';
import usePostStore from '@/stores/postStore';

/**
 * 投稿詳細ページの中身（components/PostDetailClient.jsx）
 * 投稿1件＋返信フォーム＋コメント一覧
 */
export const PostDetailClient = ({ postId }) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    currentPost: post,
    currentPostLoading,
    currentPostId,
    comments,
    fetchPost,
    fetchComments,
    deletePost,
    toggleReaction,
    addComment,
    deleteComment,
    subscribeComments,
  } = usePostStore();

  useEffect(() => {
    fetchPost(postId, user?.uid);
    fetchComments(postId);
  }, [postId, user?.uid, fetchPost, fetchComments]);

  // Realtime：この投稿へのコメントを購読する（ページを離れたら解除）
  useEffect(() => {
    const unsubscribe = subscribeComments(postId);
    return () => unsubscribe();
  }, [postId, subscribeComments]);

  const handleDeletePost = async (id) => {
    await deletePost(id);
    router.replace('/'); // 消した投稿のページには居られないのでトップへ
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x">
      <PageHeader title="投稿" />
      {currentPostLoading || currentPostId !== postId ? (
        <p className="px-4 py-16 text-center text-muted-foreground">読み込み中...</p>
      ) : !post ? (
        <p className="px-4 py-16 text-center text-muted-foreground">投稿が見つかりません</p>
      ) : (
        <>
          <PostRow
            post={post}
            onDelete={post.userId === user?.uid ? handleDeletePost : undefined}
            onToggleLike={user ? (p) => toggleReaction(p, 'like', user.uid) : undefined}
            onToggleBad={user ? (p) => toggleReaction(p, 'bad', user.uid) : undefined}
          />
          {user && <CommentForm user={user} onSubmit={(content) => addComment({ postId, content, user })} />}
          {comments.length === 0 ? (
            <p className="px-4 py-8 text-center text-muted-foreground">まだコメントはありません</p>
          ) : (
            <div className="mx-4 my-2 ml-6 border-l-2 pl-4 md:mr-6">
              {comments.map((c) => (
                <CommentRow
                  key={c.id}
                  comment={c}
                  onDelete={
                    c.userId === user?.uid
                      ? async () => {
                          if (!window.confirm('このコメントを削除しますか？')) return;
                          try {
                            await deleteComment(c);
                          } catch (error) {
                            window.alert(error.message);
                          }
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
};

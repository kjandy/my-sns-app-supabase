'use client';

import { CommentForm } from '@/components/CommentForm';
import { CommentRow } from '@/components/CommentRow';
import { PageHeader } from '@/components/PageHeader';
import { PostRow } from '@/components/PostRow';
import { DUMMY_CURRENT_USER_ID, dummyComments, dummyPosts, dummyUsers } from '@/lib/dummyData';

/**
 * 投稿詳細ページの中身（components/PostDetailClient.jsx）
 * 投稿1件＋返信フォーム＋コメント一覧
 */
export const PostDetailClient = ({ postId }) => {
  const post = dummyPosts.find((p) => p.id === postId);
  const comments = dummyComments.filter((c) => c.postId === postId);
  const me = dummyUsers.find((u) => u.uid === DUMMY_CURRENT_USER_ID);

  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x">
      <PageHeader title="投稿" />
      {!post ? (
        <p className="px-4 py-16 text-center text-muted-foreground">投稿が見つかりません</p>
      ) : (
        <>
          <PostRow post={post} />
          <CommentForm user={me} />
          {comments.length === 0 ? (
            <p className="px-4 py-8 text-center text-muted-foreground">まだコメントはありません</p>
          ) : (
            // ml-6 border-l-2 … 左に縦線を引いて「この投稿への返信」だと分かるようにする
            <div className="mx-4 my-2 ml-6 border-l-2 pl-4 md:mr-6">
              {comments.map((c) => (
                <CommentRow key={c.id} comment={c} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
};

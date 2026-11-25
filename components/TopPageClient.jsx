'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FloatingPostButton } from '@/components/FloatingPostButton';
import { PostRow } from '@/components/PostRow';
import { TimelineTabs } from '@/components/TimelineTabs';
import { dummyFollows } from '@/lib/dummyData';
import useAuthStore from '@/stores/authStore';
import usePostStore from '@/stores/postStore';

/**
 * トップページの中身（components/TopPageClient.jsx）
 * 投稿の読み書きは postStore に任せ、ここは「表示」と「ボタンが押されたら呼ぶ」だけ。
 */
export const TopPageClient = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('public');
  const { user } = useAuthStore();
  const { timeline, fetchTimeline, createPost, deletePost, toggleReaction } = usePostStore();

  // フォロー中の人＋自分（第3回 Step3 でフォローもストアに移す）
  const followingIds = dummyFollows.filter((f) => f.followerId === user?.uid).map((f) => f.followeeId);
  const userIdsKey = [...followingIds, user?.uid].join(',');

  // タブやユーザーが変わったら読み込み直す
  useEffect(() => {
    if (!user) return;
    fetchTimeline({ mode: activeTab, myUid: user.uid, userIds: userIdsKey.split(',') });
  }, [activeTab, user, userIdsKey, fetchTimeline]);

  if (!user) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl border-x px-4 py-16 text-center text-muted-foreground">
        ログインしてください
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x">
      <TimelineTabs value={activeTab} onChange={setActiveTab} />
      {timeline.length === 0 && (
        <p className="px-4 py-16 text-center text-muted-foreground">まだ投稿がありません</p>
      )}
      {timeline.map((post) => (
        <PostRow
          key={post.id}
          post={post}
          onClick={() => router.push(`/post/${post.id}`)}
          // 自分の投稿のときだけ削除できるようにする
          onDelete={post.userId === user.uid ? deletePost : undefined}
          onToggleLike={(p) => toggleReaction(p, 'like', user.uid)}
          onToggleBad={(p) => toggleReaction(p, 'bad', user.uid)}
        />
      ))}
      <FloatingPostButton onSubmit={(content) => createPost({ content, user })} />
    </main>
  );
};

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FloatingPostButton } from '@/components/FloatingPostButton';
import { PostRow } from '@/components/PostRow';
import { TimelineTabs } from '@/components/TimelineTabs';
import { DUMMY_CURRENT_USER_ID, dummyFollows, dummyPosts } from '@/lib/dummyData';

/**
 * トップページの中身（components/TopPageClient.jsx）
 * タブの切り替えという「状態」を持つので、Client Component にする。
 */
export const TopPageClient = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('public');

  // フォロー中の人＋自分の投稿だけに絞る
  const followingIds = dummyFollows
    .filter((f) => f.followerId === DUMMY_CURRENT_USER_ID)
    .map((f) => f.followeeId);
  const visibleIds = [...followingIds, DUMMY_CURRENT_USER_ID];

  const posts =
    activeTab === 'public'
      ? dummyPosts
      : dummyPosts.filter((p) => visibleIds.includes(p.userId));

  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x">
      <TimelineTabs value={activeTab} onChange={setActiveTab} />
      {posts.map((post) => (
        <PostRow key={post.id} post={post} onClick={() => router.push(`/post/${post.id}`)} />
      ))}
      <FloatingPostButton />
    </main>
  );
};

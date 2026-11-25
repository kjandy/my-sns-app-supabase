'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FloatingPostButton } from '@/components/FloatingPostButton';
import { PostRow } from '@/components/PostRow';
import { TimelineTabs } from '@/components/TimelineTabs';
import { dummyFollows, dummyPosts } from '@/lib/dummyData';
import useAuthStore from '@/stores/authStore';

/**
 * トップページの中身（components/TopPageClient.jsx）
 * タブの切り替えという「状態」を持つので、Client Component にする。
 */
export const TopPageClient = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('public');
  const { user } = useAuthStore();

  // フォロー中の人＋自分の投稿だけに絞る
  const followingIds = dummyFollows
    .filter((f) => f.followerId === user?.uid)
    .map((f) => f.followeeId);
  const visibleIds = [...followingIds, user?.uid];

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

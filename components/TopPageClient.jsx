'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FloatingPostButton } from '@/components/FloatingPostButton';
import { PostRow } from '@/components/PostRow';
import { TimelineTabs } from '@/components/TimelineTabs';
import useAuthStore from '@/stores/authStore';
import usePostStore from '@/stores/postStore';
import useProfileStore from '@/stores/profileStore';

/**
 * トップページの中身（components/TopPageClient.jsx）
 * 投稿の読み書きは postStore に任せ、ここは「表示」と「ボタンが押されたら呼ぶ」だけ。
 */
export const TopPageClient = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('public');
  const { user, loading } = useAuthStore();
  const {
    timeline,
    timelineLoading,
    timelineHasMore,
    fetchTimeline,
    loadMoreTimeline,
    subscribeTimeline,
    createPost,
    deletePost,
    toggleReaction,
  } = usePostStore();
  const loadMoreRef = useRef(null);

  const { followingIds, fetchMyFollowing } = useProfileStore();

  // ログイン中の人がフォローしている人の一覧を読む
  useEffect(() => {
    if (user) fetchMyFollowing(user.uid);
  }, [user, fetchMyFollowing]);

  // フォロー中の人＋自分
  const userIdsKey = [...followingIds, user?.uid].join(',');

  // タブやユーザーが変わったら読み込み直す
  useEffect(() => {
    if (!user) return;
    fetchTimeline({ mode: activeTab, myUid: user.uid, userIds: userIdsKey.split(',') });
  }, [activeTab, user, userIdsKey, fetchTimeline]);

  // Realtime：画面を開いている間だけ購読する（離れたら解除）
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeTimeline();
    return () => unsubscribe();
  }, [user, subscribeTimeline]);

  // 無限スクロール：一覧の一番下（loadMoreRef）が画面に入ったら続きを読む
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !timelineHasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreTimeline();
      },
      { rootMargin: '200px' }, // 少し手前で読み始める
    );
    observer.observe(target);
    return () => observer.disconnect(); // 購読したら必ず解除する
  }, [timelineHasMore, loadMoreTimeline, timeline.length]);

  // ログイン状態の判定中は何も出さない（proxy があるので、未ログインならここへは来ない）
  if (loading || !user) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl border-x px-4 py-16 text-center text-muted-foreground">
        読み込み中...
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x">
      <TimelineTabs value={activeTab} onChange={setActiveTab} />
      {timeline.length === 0 && !timelineLoading && (
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
      {/* この要素が見えたら続きを読む（見えない目印） */}
      <div ref={loadMoreRef} className="h-10" />
      {timelineLoading && <p className="pb-8 text-center text-sm text-muted-foreground">読み込み中...</p>}
      <FloatingPostButton onSubmit={(content) => createPost({ content, user })} />
    </main>
  );
};

'use client';

import { useRouter } from 'next/navigation';
import { Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditProfileDialog } from '@/components/EditProfileDialog';
import { PageHeader } from '@/components/PageHeader';
import { PostRow } from '@/components/PostRow';
import { UserAvatar } from '@/components/UserAvatar';
import { dummyFollows, dummyPosts, dummyUsers } from '@/lib/dummyData';
import useAuthStore from '@/stores/authStore';

/**
 * プロフィールページの中身（components/ProfileClient.jsx）
 * ヘッダー画像・アイコン・名前・自己紹介・フォロー数と、その人の投稿一覧
 */
export const ProfileClient = ({ uid }) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const profile = dummyUsers.find((u) => u.uid === uid);
  const posts = dummyPosts.filter((p) => p.userId === uid);
  const isMe = uid === user?.uid;
  const followingCount = dummyFollows.filter((f) => f.followerId === uid).length;
  const followerCount = dummyFollows.filter((f) => f.followeeId === uid).length;
  const isFollowing = dummyFollows.some(
    (f) => f.followerId === user?.uid && f.followeeId === uid,
  );

  if (!profile) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl border-x">
        <PageHeader title="プロフィール" />
        <p className="px-4 py-16 text-center text-muted-foreground">ユーザーが見つかりません</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl border-x">
      <PageHeader title="プロフィール" />

      <div className="border-b pb-4">
        {/* ヘッダー画像。URLが無ければグレーの帯にする */}
        <div
          className="h-32 bg-muted bg-cover bg-center md:h-56"
          style={profile.bannerURL ? { backgroundImage: `url(${profile.bannerURL})` } : undefined}
        />
        <div className="px-4 md:px-8">
          <div className="flex items-end justify-between gap-3">
            {/* -mt-10 … アイコンを上に持ち上げてヘッダー画像に重ねる */}
            <UserAvatar
              name={profile.displayName}
              photoURL={profile.photoURL}
              className="-mt-10 size-20 border-4 border-background bg-background md:-mt-16 md:size-32"
              fallbackClassName="text-2xl md:text-4xl"
            />
            {isMe ? (
              <EditProfileDialog profile={profile} />
            ) : (
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="icon-lg" aria-label="メッセージを送る" onClick={() => router.push('/messages')}>
                  <Mail className="size-4" />
                </Button>
                <Button variant={isFollowing ? 'outline' : 'default'} size="lg">
                  {isFollowing ? 'フォロー中' : 'フォロー'}
                </Button>
              </div>
            )}
          </div>

          <div className="mt-3 min-w-0">
            <h2 className="truncate text-xl font-bold md:text-3xl">{profile.displayName}</h2>
            {profile.bio && <p className="mt-3 whitespace-pre-wrap text-[15px]">{profile.bio}</p>}
            {profile.location && (
              <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                {profile.location}
              </div>
            )}
            <div className="mt-3 flex gap-4 text-sm">
              <span>
                <strong>{followingCount}</strong> <span className="text-muted-foreground">フォロー中</span>
              </span>
              <span>
                <strong>{followerCount}</strong> <span className="text-muted-foreground">フォロワー</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        {posts.length === 0 ? (
          <p className="px-4 py-16 text-center text-muted-foreground">まだ投稿がありません</p>
        ) : (
          posts.map((post) => (
            <PostRow key={post.id} post={post} onClick={() => router.push(`/post/${post.id}`)} />
          ))
        )}
      </div>
    </main>
  );
};

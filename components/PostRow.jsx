'use client';

import { useRouter } from 'next/navigation';
import { MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReactionButtons } from '@/components/ReactionButtons';
import { UserAvatar } from '@/components/UserAvatar';
import { cn, formatRelativeTime } from '@/lib/utils';
import { DUMMY_CURRENT_USER_ID } from '@/lib/dummyData';

/**
 * 投稿1件分の表示（components/PostRow.jsx）
 *
 * props
 *   post     … 表示する投稿
 *   onClick  … 行全体を押したときの処理（渡さなければクリックできない）
 *   onDelete … 削除ボタンの処理。「渡されたときだけゴミ箱を出す」約束にしてある。
 *              誰が消せるかを判断するのは呼び出し側。
 *   onToggleLike / onToggleBad … いいね・Bad を押したときの処理
 */
export const PostRow = ({ post, onClick, onDelete, onToggleLike, onToggleBad }) => {
  const router = useRouter();
  // 第1回は「ログイン中ユーザー」をダミーの固定値にしておく（第3回でストアに置き換える）
  const isOwnPost = post.userId === DUMMY_CURRENT_USER_ID;

  const goToProfile = (e) => {
    e.stopPropagation();
    router.push(`/profile/${post.userId}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(post.id);
  };

  return (
    <article
      onClick={onClick}
      className={cn(
        'flex gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/40 md:px-6',
        onClick && 'cursor-pointer',
      )}
    >
      <button type="button" onClick={goToProfile} aria-label={`${post.userName}のプロフィール`}>
        <UserAvatar name={post.userName} photoURL={post.userPhotoURL} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="truncate font-bold">{post.userName}</span>
          <span className="text-muted-foreground">·</span>
          {/* 相対時間はサーバーとブラウザで数秒ずれることがあるので、差分の警告を抑える */}
          <span className="shrink-0 text-muted-foreground" suppressHydrationWarning>
            {formatRelativeTime(post.createdAt)}
          </span>
          {isOwnPost && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              あなた
            </span>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
              aria-label="削除"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>

        <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px]">{post.content}</p>

        <div className="mt-2 -ml-1.5 flex items-center gap-4">
          <ReactionButtons
            likeCount={post.likeCount}
            badCount={post.badCount}
            likedByMe={post.likedByMe}
            badByMe={post.badByMe}
            onToggleLike={onToggleLike ? () => onToggleLike(post) : undefined}
            onToggleBad={onToggleBad ? () => onToggleBad(post) : undefined}
          />
          <div className="flex items-center gap-1.5 px-1.5 py-1 text-sm text-muted-foreground">
            <MessageCircle className="size-4" />
            {post.commentCount > 0 && <span>{post.commentCount}</span>}
          </div>
        </div>
      </div>
    </article>
  );
};

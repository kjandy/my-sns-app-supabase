'use client';

import { Heart, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * いいね・Bad ボタン（components/ReactionButtons.jsx）
 *
 * 表示に必要なものは props で受け取るだけにしてある。
 * 「押されたらどうするか」（onToggleLike / onToggleBad）も外から渡す。
 * → この部品はデータの置き場所（ダミー／Supabase）を知らなくてよい。
 */
export const ReactionButtons = ({
  likeCount = 0,
  badCount = 0,
  likedByMe = false,
  badByMe = false,
  onToggleLike,
  onToggleBad,
}) => {
  // 投稿行全体のクリック（詳細ページへの移動）が発火しないように止める
  const handle = (fn) => (e) => {
    e.stopPropagation();
    fn?.();
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={handle(onToggleLike)}
        aria-pressed={likedByMe}
        aria-label="いいね"
        className={cn(
          'flex items-center gap-1.5 rounded-full px-1.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-pink-500/10 hover:text-pink-600',
          likedByMe && 'text-pink-600',
        )}
      >
        <Heart className={cn('size-4', likedByMe && 'fill-current')} />
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>
      <button
        type="button"
        onClick={handle(onToggleBad)}
        aria-pressed={badByMe}
        aria-label="Bad"
        className={cn(
          'flex items-center gap-1.5 rounded-full px-1.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary',
          badByMe && 'text-primary',
        )}
      >
        <ThumbsDown className={cn('size-4', badByMe && 'fill-current')} />
        {badCount > 0 && <span>{badCount}</span>}
      </button>
    </div>
  );
};

'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { formatRelativeTime } from '@/lib/utils';

/**
 * コメント1件分の表示（components/CommentRow.jsx）
 * onDelete を渡したときだけ削除ボタンを出す（PostRow と同じ約束）。
 */
export const CommentRow = ({ comment, onDelete }) => (
  <div className="flex gap-3 border-b py-3 last:border-b-0">
    <UserAvatar
      name={comment.userName}
      photoURL={comment.userPhotoURL}
      className="size-8"
      fallbackClassName="text-xs"
    />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5 text-sm">
        <span className="truncate font-bold">{comment.userName}</span>
        <span className="text-muted-foreground">·</span>
        <span className="shrink-0 text-muted-foreground" suppressHydrationWarning>
          {formatRelativeTime(comment.createdAt)}
        </span>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(comment.id)}
            aria-label="コメントを削除"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
      <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px]">{comment.content}</p>
    </div>
  </div>
);

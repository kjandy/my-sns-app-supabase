'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';

/**
 * 返信（コメント）の入力欄（components/CommentForm.jsx）
 * onSubmit … 入力された文字列を受け取って保存する処理（第1〜2回は渡さない＝見た目だけ）
 */
export const CommentForm = ({ user, onSubmit }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || !onSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit(text);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 border-b p-4 md:p-6">
      <UserAvatar name={user?.displayName} photoURL={user?.photoURL} className="size-9" fallbackClassName="text-xs" />
      <div className="flex-1 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="返信をポスト"
          rows={2}
          maxLength={280}
          className="w-full resize-none border-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
        <div className="flex justify-end border-t pt-3">
          <Button type="submit" disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? '返信中...' : '返信'}
          </Button>
        </div>
      </div>
    </form>
  );
};

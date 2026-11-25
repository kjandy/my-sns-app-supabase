'use client';

import { useState } from 'react';
import { PenSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

/**
 * 右下の投稿ボタンと、新規投稿ダイアログ（components/FloatingPostButton.jsx）
 *
 * onSubmit … 投稿内容（文字列）を受け取って保存する処理。
 *            第1回は渡さない（＝見た目だけ）。第3回でストアの処理を渡す。
 */
export const FloatingPostButton = ({ onSubmit }) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const MAX = 280; // 1投稿の最大文字数（第6回でDB側にも同じ制限をかける）

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setIsSubmitting(true);
    try {
      await onSubmit?.(text);
      setContent('');
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label="投稿する"
          className="fixed right-6 bottom-20 z-40 size-14 rounded-full shadow-lg md:bottom-6"
        >
          <PenSquare className="size-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新規投稿</DialogTitle>
          <DialogDescription className="sr-only">投稿する内容を入力してください</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="post-content">内容</Label>
            <textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="いまどうしてる？"
              maxLength={MAX}
              className="min-h-[120px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-right text-xs text-muted-foreground">
              {content.length} / {MAX}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? '投稿中...' : '投稿'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

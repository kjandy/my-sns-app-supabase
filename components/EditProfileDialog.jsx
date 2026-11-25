'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * プロフィール編集ダイアログ（components/EditProfileDialog.jsx）
 *
 * profile  … 今のプロフィール（入力欄の初期値になる）
 * onSave   … 入力内容 { displayName, bio, location, bannerURL } を受け取って保存する処理
 *            第2回は渡さない（＝見た目だけ）
 */
export const EditProfileDialog = ({ profile, onSave }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ダイアログを開いた瞬間の値で入力欄を初期化する
  const handleOpenChange = (next) => {
    if (next) {
      setForm({
        displayName: profile.displayName ?? '',
        bio: profile.bio ?? '',
        location: profile.location ?? '',
        bannerURL: profile.bannerURL ?? '',
      });
    }
    setOpen(next);
  };

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave?.({ ...form, displayName: form.displayName.trim() });
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-2">
          プロフィールを編集
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>プロフィールを編集</DialogTitle>
          <DialogDescription className="sr-only">表示名や自己紹介を変更できます</DialogDescription>
        </DialogHeader>
        {form && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">表示名（1〜50文字）</Label>
              <Input id="display-name" value={form.displayName} onChange={update('displayName')} maxLength={50} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner-url">ヘッダー画像URL</Label>
              <Input id="banner-url" type="url" value={form.bannerURL} onChange={update('bannerURL')} placeholder="https://example.com/banner.jpg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">自己紹介</Label>
              <textarea
                id="bio"
                value={form.bio}
                onChange={update('bio')}
                maxLength={160}
                placeholder="自己紹介を書いてください"
                className="min-h-[90px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">出身地</Label>
              <Input id="location" value={form.location} onChange={update('location')} placeholder="例：東京" maxLength={30} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

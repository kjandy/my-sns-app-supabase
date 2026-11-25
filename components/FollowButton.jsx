'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * フォロー／フォロー中ボタン（components/FollowButton.jsx）
 * 「フォロー中」の上にマウスを乗せると「フォロー解除」と表示する（よくあるSNSの作法）
 */
export const FollowButton = ({ isFollowing, onFollow, onUnfollow }) => {
  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      await (isFollowing ? onUnfollow() : onFollow());
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size="lg"
      variant={isFollowing ? 'outline' : 'default'}
      disabled={busy}
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={isFollowing && hover ? 'border-destructive/50 text-destructive' : undefined}
    >
      {isFollowing ? (hover ? 'フォロー解除' : 'フォロー中') : 'フォロー'}
    </Button>
  );
};

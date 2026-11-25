'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { UserAvatar } from '@/components/UserAvatar';
import { formatRelativeTime } from '@/lib/utils';
import useDmStore from '@/stores/dmStore';

/**
 * 会話一覧（components/ConversationListClient.jsx）
 * 新しいメッセージがあった会話から順に並べる。
 */
export const ConversationListClient = () => {
  const { conversations, conversationsLoading, fetchConversations } = useDmStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x">
      <PageHeader title="メッセージ" />
      {conversations.length === 0 && !conversationsLoading && (
        <p className="px-4 py-16 text-center text-muted-foreground">
          まだメッセージはありません。
          <br />
          相手のプロフィールの「✉」ボタンから始められます。
        </p>
      )}
      {conversations.map((c) => (
        <Link
          key={c.id}
          href={`/messages/${c.otherUserId}`}
          className="flex items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/40 md:px-6"
        >
          <UserAvatar name={c.otherName} photoURL={c.otherPhotoURL} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="truncate font-bold">{c.otherName}</span>
              <span className="text-muted-foreground">·</span>
              <span className="shrink-0 text-muted-foreground" suppressHydrationWarning>
                {formatRelativeTime(c.lastMessageAt)}
              </span>
            </div>
            <p className="truncate text-sm text-muted-foreground">{c.lastMessage}</p>
          </div>
        </Link>
      ))}
    </main>
  );
};

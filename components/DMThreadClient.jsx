'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { cn, formatRelativeTime } from '@/lib/utils';
import useAuthStore from '@/stores/authStore';
import useDmStore from '@/stores/dmStore';
import useProfileStore from '@/stores/profileStore';

/**
 * 1対1のメッセージ画面（components/DMThreadClient.jsx）
 * otherUid … 相手の uid（/messages/[uid] の uid）
 */
export const DMThreadClient = ({ otherUid }) => {
  const { user } = useAuthStore();
  const { currentConversationId, messages, openConversation, sendMessage, markRead, subscribeMessages } =
    useDmStore();
  const other = useProfileStore((s) => s.profiles[otherUid]);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // 相手のプロフィールと会話を読み込む
  useEffect(() => {
    fetchProfile(otherUid);
    openConversation(otherUid).catch((e) => setError(e.message));
  }, [otherUid, fetchProfile, openConversation]);

  // 会話が開けたら：既読にして、新しいメッセージの購読を始める（画面を離れたら解除）
  useEffect(() => {
    if (!currentConversationId || !user) return;
    markRead(currentConversationId);
    const unsubscribe = subscribeMessages(currentConversationId, user.uid);
    return () => unsubscribe();
  }, [currentConversationId, user, markRead, subscribeMessages]);

  // メッセージが増えたら一番下までスクロールする
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || !currentConversationId) return;
    setSending(true);
    try {
      await sendMessage(currentConversationId, text);
      setContent('');
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-56px)] max-w-2xl flex-col border-x">
      <PageHeader title={other?.displayName ?? 'メッセージ'} />

      <div className="flex-1 space-y-3 px-4 py-4 md:px-6">
        {error && <p className="py-8 text-center text-destructive">{error}</p>}
        {!error && messages.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">最初のメッセージを送ってみましょう</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === user?.uid;
          return (
            // 自分のメッセージは右・青、相手のメッセージは左・グレー
            <div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
              <p
                className={cn(
                  'max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-[15px]',
                  mine ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-muted',
                )}
              >
                {m.content}
              </p>
              <span className="mt-1 text-xs text-muted-foreground" suppressHydrationWarning>
                {formatRelativeTime(m.createdAt)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄：スマホでは下部ナビの上に来るよう、sticky で画面下に固定する */}
      <form onSubmit={handleSend} className="sticky bottom-16 flex gap-2 border-t bg-background p-3 md:bottom-0">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="メッセージを入力"
          rows={1}
          maxLength={1000}
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" size="icon-lg" disabled={sending || !content.trim() || !currentConversationId} aria-label="送信">
          <Send className="size-4" />
        </Button>
      </form>
    </main>
  );
};

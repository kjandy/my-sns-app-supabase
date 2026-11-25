/**
 * DM（ダイレクトメッセージ）のストア（stores/dmStore.js）— 第11回
 *
 * 会話一覧は conversation_list ビュー、メッセージは messages テーブルを使う。
 * 会話を「作る」のは DB の関数 get_or_create_conversation（rpc で呼ぶ）。
 */
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const toConversation = (row) => ({
  id: row.id,
  otherUserId: row.other_user_id,
  otherName: row.other_name,
  otherPhotoURL: row.other_photo_url,
  lastMessage: row.last_message,
  lastMessageAt: row.last_message_at,
  lastSenderId: row.last_sender_id,
  unread: row.unread,
});

const toMessage = (row) => ({
  id: row.id,
  conversationId: row.conversation_id,
  senderId: row.sender_id,
  content: row.content,
  createdAt: row.created_at,
});

const useDmStore = create((set, get) => ({
  // --- State ---
  conversations: [],
  conversationsLoading: false,
  currentConversationId: null,
  messages: [],

  // --- 会話一覧 ---
  // まだ1通もやり取りしていない会話（last_message_at が null）は出さない
  fetchConversations: async () => {
    set({ conversationsLoading: true });
    const { data, error } = await supabase
      .from('conversation_list')
      .select('*')
      .not('last_message_at', 'is', null)
      .order('last_message_at', { ascending: false });
    if (error) console.error('fetchConversations', error.message);
    set({ conversations: (data ?? []).map(toConversation), conversationsLoading: false });
  },

  // --- 1つの会話 ---
  // 相手の uid から会話を開く（無ければ DB の関数が作ってくれる）
  openConversation: async (otherUid) => {
    set({ currentConversationId: null, messages: [] });
    const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
      other_user: otherUid,
    });
    if (error) throw new Error(`会話を開けませんでした：${error.message}`);
    set({ currentConversationId: conversationId });
    await get().fetchMessages(conversationId);
    return conversationId;
  },
  fetchMessages: async (conversationId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) console.error('fetchMessages', error.message);
    set({ messages: (data ?? []).map(toMessage) });
  },
  // 送信（sender_id は DB の default auth.uid() が入る）
  sendMessage: async (conversationId, content) => {
    const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, content });
    if (error) throw new Error(`送信に失敗しました：${error.message}`);
    await get().fetchMessages(conversationId);
  },
}));

export default useDmStore;

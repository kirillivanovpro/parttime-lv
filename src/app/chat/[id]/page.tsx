'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Message, Chat, Profile } from '@/types';

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { T } = useLang();
  const router = useRouter();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { router.push('/auth'); return; }

    async function loadChat() {
      const [chatRes, msgsRes] = await Promise.all([
        supabase
          .from('chats')
          .select('*, listing:listings(id, title, category)')
          .eq('id', id)
          .single(),
        supabase
          .from('messages')
          .select('*, profiles(*)')
          .eq('chat_id', id)
          .order('created_at', { ascending: true }),
      ]);

      if (!chatRes.data || !chatRes.data.participant_ids.includes(user!.id)) {
        router.push('/chat');
        return;
      }

      setChat(chatRes.data as Chat);
      setMessages((msgsRes.data as Message[]) || []);

      const otherId = chatRes.data.participant_ids.find((p: string) => p !== user!.id);
      if (otherId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherId)
          .single();
        if (profile) setOtherUser(profile as Profile);
      }
      setLoading(false);
    }

    loadChat();

    // Realtime subscription
    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${id}` },
        async (payload) => {
          const msg = payload.new as Message;
          // Fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', msg.sender_id)
            .single();
          setMessages((prev) => [...prev, { ...msg, profiles: profile || undefined }]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, user, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSending(true);
    const content = text.trim();
    setText('');

    await supabase.from('messages').insert({
      chat_id: id,
      sender_id: user.id,
      content,
    });

    // Update last_message_at
    await supabase
      .from('chats')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', id);

    setSending(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#8BC34A]">{T('loading')}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-[#0f0f0f]">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-3 flex items-center gap-3">
        <Link href="/chat" className="text-gray-500 hover:text-white transition-colors">
          ←
        </Link>
        <div className="w-9 h-9 rounded-full bg-[#8BC34A]/20 flex items-center justify-center text-[#8BC34A] font-bold">
          {(otherUser?.full_name || '?')[0].toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-white text-sm">{otherUser?.full_name || '—'}</div>
          {chat?.listing && (
            <div className="text-[#8BC34A] text-xs truncate max-w-xs">
              re: {(chat.listing as { title: string }).title}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-[#8BC34A] text-black rounded-br-sm'
                    : 'bg-[#1a1a1a] text-white border border-[#2a2a2a] rounded-bl-sm'
                }`}
              >
                <p>{msg.content}</p>
                <div
                  className={`text-xs mt-1 ${
                    isMe ? 'text-black/50' : 'text-gray-600'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="bg-[#1a1a1a] border-t border-[#2a2a2a] px-4 py-3 flex gap-3"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={T('type_message')}
          className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-[#8BC34A] text-black font-bold px-5 py-2.5 rounded-xl hover:bg-[#9DD45B] disabled:opacity-40 transition-colors"
        >
          {T('send')}
        </button>
      </form>
    </div>
  );
}

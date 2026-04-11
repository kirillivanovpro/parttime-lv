'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Chat } from '@/types';

export default function ChatListPage() {
  const { user } = useAuth();
  const { T } = useLang();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    async function loadChats() {
      const { data } = await supabase
        .from('chats')
        .select(`
          *,
          listing:listings(id, title, category),
          messages(content, created_at, sender_id)
        `)
        .contains('participant_ids', [user!.id])
        .order('last_message_at', { ascending: false });

      if (data) {
        // Get other participant profiles
        const chatsWithProfiles = await Promise.all(
          (data as Chat[]).map(async (chat) => {
            const otherId = chat.participant_ids.find((pid) => pid !== user!.id);
            if (otherId) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', otherId)
                .single();
              return { ...chat, other_participant: profile };
            }
            return chat;
          })
        );
        setChats(chatsWithProfiles);
      }
      setLoading(false);
    }

    loadChats();
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">{T('messages')}</h1>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-4">💬</div>
            <p>{T('no_chats')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="block bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#8BC34A]/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#8BC34A]/20 flex items-center justify-center text-[#8BC34A] font-bold flex-shrink-0">
                    {(chat.other_participant?.full_name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">
                        {chat.other_participant?.full_name || '—'}
                      </span>
                      <span className="text-gray-600 text-xs">
                        {new Date(chat.last_message_at).toLocaleDateString()}
                      </span>
                    </div>
                    {chat.listing && (
                      <div className="text-[#8BC34A] text-xs mt-0.5 truncate">
                        re: {(chat.listing as { title: string }).title}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

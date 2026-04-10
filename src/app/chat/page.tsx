'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Send, ArrowLeft, User as UserIcon, MessageCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { useApp } from '@/lib/context'
import { t } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { Conversation, Message, Profile } from '@/types/database'
import Link from 'next/link'

interface ConversationWithDetails extends Conversation {
  other_user: Profile
  listing_title?: string
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  )
}

function ChatPageInner() {
  const { lang, user } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()

  const listingId = searchParams.get('listing')
  const targetUserId = searchParams.get('user')

  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
    fetchConversations()
  }, [user])

  useEffect(() => {
    // If coming from listing contact, create/find conversation
    if (targetUserId && user && targetUserId !== user.id) {
      ensureConversation(targetUserId, listingId ?? undefined)
    }
  }, [targetUserId, user])

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId)
      // Subscribe to new messages
      const channel = supabase
        .channel(`messages:${activeConversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [activeConversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    if (!user) return
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (!data) { setLoading(false); return }

    const convList = data as Conversation[]
    const withDetails: ConversationWithDetails[] = await Promise.all(
      convList.map(async (conv) => {
        const otherId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherId)
          .single()
        return { ...conv, other_user: profile as unknown as Profile }
      })
    )

    setConversations(withDetails)
    setLoading(false)
  }

  const ensureConversation = async (otherUserId: string, relatedListingId?: string) => {
    if (!user) return

    // Check if conversation already exists
    const { data: existingData } = await supabase
      .from('conversations')
      .select('*')
      .or(
        `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
      )
      .maybeSingle()

    const existing = existingData as Conversation | null

    if (existing) {
      setActiveConversationId(existing.id)
      fetchConversations()
      return
    }

    // Create new conversation
    const { data: newConvData } = await supabase
      .from('conversations')
      .insert({
        participant_1: user.id,
        participant_2: otherUserId,
        listing_id: relatedListingId ?? null,
      })
      .select()
      .single()

    const newConv = newConvData as Conversation | null

    if (newConv) {
      setActiveConversationId(newConv.id)
      fetchConversations()
    }
  }

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])

    // Mark as read
    if (user) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversationId || !user) return
    setSending(true)

    const content = newMessage.trim()
    setNewMessage('')

    await supabase.from('messages').insert({
      conversation_id: activeConversationId,
      sender_id: user.id,
      content,
    })

    await supabase
      .from('conversations')
      .update({ last_message: content, last_message_at: new Date().toISOString() })
      .eq('id', activeConversationId)

    setSending(false)
  }

  const activeConversation = conversations.find(c => c.id === activeConversationId)

  if (!user) return null

  return (
    <div className="h-[calc(100vh-7rem)] md:h-[calc(100vh-4rem)] flex">
      {/* Conversations sidebar */}
      <div className={clsx(
        'w-full md:w-80 border-r border-zinc-800 flex flex-col',
        activeConversationId && 'hidden md:flex'
      )}>
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-lg font-bold text-white">{t(lang, 'chat_title')}</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-zinc-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t(lang, 'chat_no_conversations')}</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={clsx(
                  'w-full flex items-center gap-3 p-4 hover:bg-zinc-800 transition-colors text-left',
                  activeConversationId === conv.id && 'bg-zinc-800'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  {conv.other_user?.avatar_url ? (
                    <img src={conv.other_user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <UserIcon size={18} className="text-zinc-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {conv.other_user?.display_name ?? 'User'}
                  </p>
                  {conv.last_message && (
                    <p className="text-zinc-500 text-xs truncate">{conv.last_message}</p>
                  )}
                </div>
                {conv.last_message_at && (
                  <span className="text-zinc-600 text-xs flex-shrink-0">
                    {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={clsx(
        'flex-1 flex flex-col',
        !activeConversationId && 'hidden md:flex'
      )}>
        {activeConversationId && activeConversation ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
              <button
                onClick={() => setActiveConversationId(null)}
                className="md:hidden p-2 text-zinc-400 hover:text-white"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center">
                {activeConversation.other_user?.avatar_url ? (
                  <img src={activeConversation.other_user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <UserIcon size={16} className="text-zinc-500" />
                )}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {activeConversation.other_user?.display_name ?? 'User'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const isMe = msg.sender_id === user.id
                return (
                  <div key={msg.id} className={clsx('flex', isMe ? 'justify-end' : 'justify-start')}>
                    <div className={clsx(
                      'max-w-xs md:max-w-sm rounded-2xl px-4 py-2.5 text-sm',
                      isMe
                        ? 'bg-[#8BC34A] text-zinc-900 rounded-br-sm'
                        : 'bg-zinc-800 text-white rounded-bl-sm'
                    )}>
                      <p>{msg.content}</p>
                      <p className={clsx('text-xs mt-1', isMe ? 'text-zinc-700' : 'text-zinc-500')}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder={t(lang, 'chat_placeholder')}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-[#8BC34A] hover:bg-[#9CCC50] disabled:opacity-50 text-zinc-900 p-3 rounded-xl transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-3 opacity-20" />
              <p>{lang === 'lv' ? 'Izvēlies sarunu' : 'Выбери переписку'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

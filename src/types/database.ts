export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          phone: string | null
          avatar_url: string | null
          bio: string | null
          wallet_balance: number
          rating_avg: number
          rating_count: number
          preferred_lang: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          bio?: string | null
          wallet_balance?: number
          rating_avg?: number
          rating_count?: number
          preferred_lang?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          bio?: string | null
          wallet_balance?: number
          preferred_lang?: string
          updated_at?: string
        }
      }
      listings: {
        Row: {
          id: string
          user_id: string
          type: 'offer' | 'request'
          category: ListingCategory
          title_lv: string
          title_ru: string
          description_lv: string | null
          description_ru: string | null
          price: number | null
          price_unit: string | null
          location: string | null
          images: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'offer' | 'request'
          category: ListingCategory
          title_lv: string
          title_ru: string
          description_lv?: string | null
          description_ru?: string | null
          price?: number | null
          price_unit?: string | null
          location?: string | null
          images?: string[] | null
          is_active?: boolean
        }
        Update: {
          type?: 'offer' | 'request'
          category?: ListingCategory
          title_lv?: string
          title_ru?: string
          description_lv?: string | null
          description_ru?: string | null
          price?: number | null
          price_unit?: string | null
          location?: string | null
          images?: string[] | null
          is_active?: boolean
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          listing_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
        }
        Update: never
      }
      conversations: {
        Row: {
          id: string
          listing_id: string | null
          participant_1: string
          participant_2: string
          last_message: string | null
          last_message_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id?: string | null
          participant_1: string
          participant_2: string
          last_message?: string | null
          last_message_at?: string | null
        }
        Update: {
          last_message?: string | null
          last_message_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          is_read?: boolean
        }
        Update: {
          is_read?: boolean
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: string
          description: string | null
          related_listing_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: string
          description?: string | null
          related_listing_id?: string | null
        }
        Update: never
      }
    }
  }
}

export type ListingCategory =
  | 'cleaning'
  | 'dog_walking'
  | 'tutoring'
  | 'photo_video'
  | 'delivery'
  | 'repairs'

export type ListingType = 'offer' | 'request'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Listing = Database['public']['Tables']['listings']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']

export interface ListingWithProfile extends Listing {
  profiles: Profile
}

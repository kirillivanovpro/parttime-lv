export type ListingType = 'can_do' | 'need_help';

export type CategoryType =
  | 'cleaning'
  | 'dog_walking'
  | 'tutoring'
  | 'photo_video'
  | 'delivery'
  | 'repairs';

export type TransactionType = 'credit' | 'debit' | 'hold' | 'release';

export type UserRole = 'seeker' | 'employer' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  rating_avg: number;
  rating_count: number;
  wallet_balance: number;
  role: UserRole;
  plan: string;
  created_at: string;
}

export interface Listing {
  id: string;
  user_id: string;
  type: ListingType;
  category: CategoryType;
  title: string;
  description: string | null;
  price: number | null;
  price_unit: string;
  location: string | null;
  images: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Chat {
  id: string;
  listing_id: string | null;
  participant_ids: string[];
  created_at: string;
  last_message_at: string;
  listing?: Listing;
  other_participant?: Profile;
  last_message?: Message;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  profiles?: Profile;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  listing_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: Profile;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export type Lang = 'lv' | 'ru';

export type ListingCategory = 'cleaning' | 'delivery' | 'it' | 'garden' | 'moving' | 'other'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  wallet_balance: number
  is_admin: boolean
  created_at: string
}

export interface Listing {
  id: string
  user_id: string
  title: string
  description: string | null
  category: ListingCategory
  price: number | null
  location: string | null
  is_paid: boolean
  is_active: boolean
  view_count: number
  created_at: string
}

export interface ListingWithContact extends Listing {
  contact_phone: string | null
  contact_email: string | null
}

export interface ContactUnlock {
  id: string
  user_id: string
  listing_id: string
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  amount: number
  type: string
  status: string
  provider: string
  provider_ref: string | null
  created_at: string
}

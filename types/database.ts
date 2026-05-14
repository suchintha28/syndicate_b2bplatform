export interface DbBrand {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string
  logo_url: string | null
  cover_image_url: string | null
  website: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  categories: string[]
  is_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DbProduct {
  id: string
  brand_id: string
  name: string
  slug: string
  description: string
  images: string[]
  category: string
  subcategory: string | null
  min_order_quantity: number | null
  price_range_min: number | null
  price_range_max: number | null
  unit: string | null
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DbProfile {
  id: string
  full_name: string
  email: string
  role: 'buyer' | 'seller'
  avatar_url: string | null
  phone: string | null
  business_name: string | null
  business_industry: string | null
  business_website: string | null
  business_phone: string | null
  created_at: string
  updated_at: string
}

export interface DbBusinessMember {
  id: string
  brand_id: string
  profile_id: string
  member_role: 'owner' | 'admin' | 'member'
  invited_by: string | null
  joined_at: string
}

export interface DbRfq {
  id: string
  buyer_id: string
  brand_id: string | null       // null = public RFQ (open to all suppliers)
  product_id: string | null
  subject: string
  message: string
  quantity: number | null
  unit: string | null
  category: string | null
  budget_min: number | null
  budget_max: number | null
  location: string | null
  timeline: string | null
  expires_at: string | null
  images: string[]
  is_public: boolean
  status: 'pending' | 'read' | 'responded' | 'closed'
  created_at: string
  updated_at: string
  brands?: { name: string; slug: string; logo_url?: string | null } | null
  profiles?: { full_name: string; email: string; avatar_url?: string | null } | null
}

export interface DbRfqBid {
  id: string
  rfq_id: string
  bidder_id: string
  brand_id: string
  description: string
  amount: number | null
  currency: string
  timeline: string | null
  notes: string | null
  images: string[]
  status: string                // 'pending' | 'accepted' | 'rejected'
  created_at: string
  // Joins
  profiles?: { full_name: string; avatar_url: string | null } | null
  brands?: { name: string; logo_url: string | null } | null
  rfqs?: { subject: string; buyer_id: string; is_public: boolean; status: string } | null
}

export interface DbRfqResponse {
  id: string
  rfq_id: string
  sender_id: string
  message: string
  created_at: string
  profiles?: { full_name: string; avatar_url: string | null } | null
}

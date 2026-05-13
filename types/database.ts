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
  created_at: string
  updated_at: string
}

export interface DbRfq {
  id: string
  buyer_id: string
  brand_id: string
  product_id: string | null
  subject: string
  message: string
  quantity: number | null
  unit: string | null
  status: 'pending' | 'read' | 'responded' | 'closed'
  created_at: string
  updated_at: string
  brands?: { name: string; slug: string }
  profiles?: { full_name: string; email: string }
}

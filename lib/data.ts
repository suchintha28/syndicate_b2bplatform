const IMG = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

// Industry categories — used in Explore filter, HomeScreen tiles, and CategoryIcon
export const CATEGORIES = [
  'Manufacturing',
  'Technology',
  'Construction',
  'Logistics',
  'Food & Beverage',
  'Professional Services',
  'Retail & Wholesale',
  'Agriculture',
  'Healthcare',
  'Education',
  'Hospitality & Tourism',
  'Finance & Insurance',
  'Apparel & Textiles',
  'Export & Import',
  'Printing & Packaging',
]

export const CATEGORY_META: Record<string, { hue: number; cover: string; seed: string }> = {
  'Manufacturing':       { hue: 22,  cover: IMG('photo-1565793298831-09f04bb2ce80'), seed: 'manufacturing' },
  'Technology':          { hue: 250, cover: IMG('photo-1518770660439-4636190af475'), seed: 'technology' },
  'Construction':        { hue: 40,  cover: IMG('photo-1503387762-592deb58ef4e'),    seed: 'construction' },
  'Logistics':           { hue: 200, cover: IMG('photo-1601584115197-04ecc0da31d7'), seed: 'logistics' },
  'Food & Beverage':     { hue: 12,  cover: IMG('photo-1495474472287-4d71bcdd2085'), seed: 'food' },
  'Professional Services':{ hue: 270, cover: IMG('photo-1556761175-5973dc0f32e7'),   seed: 'services' },
  'Retail & Wholesale':  { hue: 340, cover: IMG('photo-1607082348824-0a96f2a4b9da'), seed: 'retail' },
  'Agriculture':         { hue: 100, cover: IMG('photo-1464226184884-fa280b87c399'), seed: 'agriculture' },
  'Healthcare':          { hue: 195, cover: IMG('photo-1576091160399-112ba8d25d1d'), seed: 'healthcare' },
  'Education':           { hue: 220, cover: IMG('photo-1580582932707-520aed937b7b'), seed: 'education' },
  'Hospitality & Tourism':{ hue: 35, cover: IMG('photo-1566073771259-6a8506099945'), seed: 'hospitality' },
  'Finance & Insurance': { hue: 215, cover: IMG('photo-1611974789855-9c2a0a7236a3'), seed: 'finance' },
  'Apparel & Textiles':  { hue: 310, cover: IMG('photo-1558618666-fcd25c85cd64'),    seed: 'apparel' },
  'Export & Import':     { hue: 180, cover: IMG('photo-1578575437130-527eed3abbec'), seed: 'export' },
  'Printing & Packaging':{ hue: 55,  cover: IMG('photo-1563986768609-322da13575f3'), seed: 'printing' },
}

export interface Business {
  id: string
  slug?: string
  logo: string
  name: string
  category: string
  rating: number
  reviews: number
  description: string
  verified: boolean
  featured: boolean
  location: string
  priceRange: string
  founded: number
  employees: string
  cover: string
  logoUrl?: string
}

export const BUSINESSES: Business[] = [
  { id: '1',  logo: 'TM', name: 'TechMakers Inc.',       category: 'Technology',   rating: 5, reviews: 48,  description: 'Leading provider of custom electronics and IoT solutions for enterprise.',          verified: true,  featured: true,  location: 'San Francisco, CA', priceRange: '$$$',  founded: 2014, employees: '50-200',   cover: IMG('photo-1518770660439-4636190af475') },
  { id: '2',  logo: 'GP', name: 'GlobalPack Solutions',  category: 'Packaging',    rating: 4, reviews: 32,  description: 'Sustainable packaging engineered for businesses serious about emissions.',          verified: true,  featured: true,  location: 'Chicago, IL',       priceRange: '$$',   founded: 2011, employees: '20-50',    cover: IMG('photo-1607344645866-009c320b63e0') },
  { id: '3',  logo: 'IC', name: 'InnoConstruct Ltd.',    category: 'Construction', rating: 5, reviews: 67,  description: 'Commercial construction with a green building focus. LEED certified.',             verified: true,  featured: true,  location: 'New York, NY',      priceRange: '$$$$', founded: 2008, employees: '200-500',  cover: IMG('photo-1503387762-592deb58ef4e') },
  { id: '4',  logo: 'SF', name: 'SmartFactory Pro',      category: 'Manufacturing',rating: 5, reviews: 89,  description: 'Advanced manufacturing automation and industrial robotics.',                       verified: true,  featured: false, location: 'Detroit, MI',       priceRange: '$$$',  founded: 2015, employees: '50-200',   cover: IMG('photo-1565793298831-09f04bb2ce80') },
  { id: '5',  logo: 'DL', name: 'DataLogix Corp',        category: 'Technology',   rating: 4, reviews: 156, description: 'Cloud infrastructure and analytics for high-growth teams.',                       verified: true,  featured: false, location: 'Austin, TX',        priceRange: '$$$$', founded: 2018, employees: '20-50',    cover: IMG('photo-1551288049-bebda4e38f71') },
  { id: '6',  logo: 'GS', name: 'GreenSupply Co.',       category: 'Logistics',    rating: 4, reviews: 72,  description: 'Eco-friendly supply chain and logistics with carbon tracking built-in.',           verified: true,  featured: false, location: 'Seattle, WA',       priceRange: '$$',   founded: 2016, employees: '20-50',    cover: IMG('photo-1586528116311-ad8dd3c8310d') },
  { id: '7',  logo: 'FB', name: 'FreshBrew Industries',  category: 'Food & Bev',   rating: 5, reviews: 43,  description: 'Specialty coffee roasting and wholesale distribution.',                           verified: true,  featured: false, location: 'Portland, OR',      priceRange: '$$',   founded: 2012, employees: '20-50',    cover: IMG('photo-1495474472287-4d71bcdd2085') },
  { id: '8',  logo: 'CS', name: 'CloudSync Solutions',   category: 'Technology',   rating: 4, reviews: 91,  description: 'Enterprise software integration and managed cloud migration.',                     verified: true,  featured: false, location: 'San Francisco, CA', priceRange: '$$$',  founded: 2017, employees: '50-200',   cover: IMG('photo-1451187580459-43490279c0fa') },
  { id: '9',  logo: 'MB', name: 'ModularBuild Inc.',     category: 'Construction', rating: 5, reviews: 38,  description: 'Prefab construction and modular building systems shipped nationwide.',             verified: true,  featured: false, location: 'Denver, CO',        priceRange: '$$$',  founded: 2019, employees: '20-50',    cover: IMG('photo-1541888946425-d81bb19240f5') },
  { id: '10', logo: 'PE', name: 'PackEco Systems',       category: 'Packaging',    rating: 4, reviews: 64,  description: 'Biodegradable packaging and zero-waste fulfillment kits.',                        verified: false, featured: false, location: 'Boston, MA',        priceRange: '$$',   founded: 2020, employees: '<20',      cover: IMG('photo-1556909114-f6e7ad7d3136') },
  { id: '11', logo: 'TL', name: 'TransLogic Network',   category: 'Logistics',    rating: 5, reviews: 127, description: 'International freight forwarding and customs brokerage.',                         verified: true,  featured: false, location: 'Miami, FL',         priceRange: '$$$$', founded: 2009, employees: '200-500',  cover: IMG('photo-1601584115197-04ecc0da31d7') },
  { id: '12', logo: 'FS', name: 'FleetSync Systems',    category: 'Services',     rating: 4, reviews: 55,  description: 'Fleet management and live vehicle tracking SaaS.',                                verified: true,  featured: false, location: 'Atlanta, GA',       priceRange: '$$',   founded: 2017, employees: '20-50',    cover: IMG('photo-1502920917128-1aa500764cbd') },
  { id: '13', logo: 'AI', name: 'AgriInnovate',         category: 'Food & Bev',   rating: 5, reviews: 29,  description: 'Smart farming sensors and agricultural IoT for high-yield operations.',           verified: true,  featured: false, location: 'Phoenix, AZ',       priceRange: '$$$',  founded: 2021, employees: '<20',      cover: IMG('photo-1625246333195-78d9c38ad449') },
  { id: '14', logo: 'WS', name: 'WeldSpecs Pro',        category: 'Manufacturing',rating: 4, reviews: 82,  description: 'Industrial welding equipment and metal fabrication services.',                    verified: true,  featured: false, location: 'Pittsburgh, PA',    priceRange: '$$',   founded: 2013, employees: '50-200',   cover: IMG('photo-1581094271901-8022df4466f9') },
  { id: '15', logo: 'DT', name: 'DigitalTrade Hub',     category: 'Services',     rating: 5, reviews: 103, description: 'B2B marketplace platform and cross-border trade facilitation.',                   verified: true,  featured: false, location: 'Los Angeles, CA',   priceRange: '$$$',  founded: 2016, employees: '50-200',   cover: IMG('photo-1556761175-5973dc0f32e7') },
]

// Sri Lankan cities — used in Explore location filter (matches brands.city column)
export const SL_LOCATIONS = [
  'All Locations',
  'Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna',
  'Trincomalee', 'Batticaloa', 'Anuradhapura', 'Ratnapura', 'Kurunegala',
  'Matara', 'Badulla', 'Kalutara', 'Hambantota', 'Ampara',
]

// Budget ranges based on products.price_range_min — replaces the broken $/$$/$$$/$$$$ filter
export const BUDGET_RANGES = [
  'All Budgets',
  'Under LKR 10,000',
  'LKR 10,000 – 100,000',
  'LKR 100,000 – 500,000',
  'Above LKR 500,000',
]

export const RATING_FILTERS = ['All Ratings', '5 Stars', '4+ Stars', '3+ Stars']

export interface ProductVariation { name: string; price: number }
export interface PriceTier { min: number; max: number | null; price: number }
export interface ProductSpec { label: string; value: string }

export interface Product {
  id: string
  slug?: string
  name: string
  price: string
  image: string
  category: string
  businessId: string
  status: 'Active' | 'Draft'
  sales: number
  variations: ProductVariation[]
  tieredPricing: PriceTier[]
  videoUrl: string
  directSales: boolean
  description: string
  productSpecs?: ProductSpec[]
  techSpecs?: ProductSpec[]
}

export const PRODUCTS: Product[] = [
  { id: '1', name: 'Smart Sensor Pro',      price: 'LKR 89,500',  image: IMG('photo-1518770660439-4636190af475'), category: 'Technology', businessId: '1', status: 'Active', sales: 24,
    variations: [{ name: 'Standard', price: 89500 }, { name: 'Advanced', price: 119500 }],
    tieredPricing: [{ min: 1, max: 10, price: 89500 }, { min: 11, max: 50, price: 83500 }, { min: 51, max: null, price: 77500 }],
    videoUrl: '', directSales: false, description: 'Industrial-grade IoT sensor with temperature, humidity, and motion detection. Built for 5-year battery life.' },
  { id: '2', name: 'IoT Gateway Plus',      price: 'LKR 149,500', image: IMG('photo-1581090700227-1e37b190418e'), category: 'Technology', businessId: '1', status: 'Active', sales: 18,
    variations: [],
    tieredPricing: [{ min: 1, max: 5, price: 149500 }, { min: 6, max: null, price: 137500 }],
    videoUrl: '', directSales: true, description: 'Industrial gateway supporting LoRaWAN, Zigbee, and BLE. Edge compute ready.' },
  { id: '3', name: 'LED Controller',        price: 'LKR 44,500',  image: IMG('photo-1518965539394-d3a7d3a6f1fd'), category: 'Technology', businessId: '1', status: 'Active', sales: 42,
    variations: [{ name: 'RGB', price: 44500 }, { name: 'RGBW', price: 53500 }],
    tieredPricing: [{ min: 1, max: 20, price: 44500 }, { min: 21, max: null, price: 41500 }],
    videoUrl: '', directSales: true, description: 'Programmable LED controller for smart building installations.' },
  { id: '4', name: 'Power Module V2',       price: 'LKR 59,500',  image: IMG('photo-1620283085439-39620a1e21c4'), category: 'Technology', businessId: '1', status: 'Draft', sales: 0,
    variations: [],
    tieredPricing: [{ min: 1, max: null, price: 59500 }],
    videoUrl: '', directSales: false, description: 'High-efficiency DC power module rated to 600W.' },
  { id: '5', name: 'Wireless Sensor Mesh', price: 'LKR 119,500', image: IMG('photo-1551808525-51a94da548ce'), category: 'Technology', businessId: '1', status: 'Active', sales: 15,
    variations: [],
    tieredPricing: [{ min: 1, max: null, price: 119500 }],
    videoUrl: '', directSales: false, description: 'Self-healing wireless mesh sensor network for industrial monitoring.' },
]

export interface Message {
  id: number
  business: string
  businessId: string
  msg: string
  time: string
  unread: boolean
  avatar: string
}

export const MESSAGES: Message[] = [
  { id: 1, business: 'TechMakers Inc.',      businessId: '1', msg: "Thanks for your interest — we've reviewed your spec and can ship a sample by Friday.", time: '2h ago',  unread: true,  avatar: 'TM' },
  { id: 2, business: 'GlobalPack Solutions', businessId: '2', msg: "We can provide a detailed quote by tomorrow. Are 50,000 units the firm target?",         time: '1d ago',  unread: true,  avatar: 'GP' },
  { id: 3, business: 'InnoConstruct Ltd.',   businessId: '3', msg: "Project timeline looks good. Sent over the revised Gantt.",                              time: '3d ago',  unread: false, avatar: 'IC' },
  { id: 4, business: 'SmartFactory Pro',     businessId: '4', msg: "Happy to walk through the automation cell on a call next week.",                         time: '5d ago',  unread: false, avatar: 'SF' },
]

export interface RFQItem {
  id: number
  title: string
  status?: string
  responses: number
  created?: string
  budget: string
  category?: string
  poster?: string
  deadline?: string
  location?: string
}

export const MY_RFQS: RFQItem[] = [
  { id: 1, title: 'Custom IoT Sensors — 500 units',   status: 'Open',        responses: 3, created: '2 days ago', budget: 'LKR 42M–54M',    category: 'Technology'   },
  { id: 2, title: 'Packaging Materials — Bulk Order', status: 'In Progress', responses: 5, created: '5 days ago', budget: 'LKR 7.5M–12M',   category: 'Packaging'    },
  { id: 3, title: 'Construction Equipment Rental',    status: 'Closed',      responses: 8, created: '1 week ago', budget: 'LKR 18M–27M',    category: 'Construction' },
]

export const BROWSE_RFQS: RFQItem[] = [
  { id: 4, title: 'LED Controllers for Smart Building Retrofit', poster: 'BuildTech Corp',    category: 'Technology',   budget: 'LKR 1.5M–3M',   created: '1h ago',  responses: 0, deadline: 'in 14 days', location: 'Colombo'  },
  { id: 5, title: 'Metal Fabrication Services — Recurring',      poster: 'AutoParts Inc',     category: 'Manufacturing',budget: 'LKR 4.5M–7.5M', created: '5h ago',  responses: 2, deadline: 'in 21 days', location: 'Kandy'    },
  { id: 6, title: 'Cold Chain Logistics, Island-wide',           poster: 'FreshDirect Foods', category: 'Logistics',    budget: 'LKR 24M–36M',   created: '1d ago',  responses: 4, deadline: 'in 30 days', location: 'Multiple' },
  { id: 7, title: 'Sustainable Packaging — DTC Brand',          poster: 'Ember & Co.',       category: 'Packaging',    budget: 'LKR 2.4M–4.5M', created: '2d ago',  responses: 6, deadline: 'in 7 days',  location: 'Colombo'  },
]

export interface Review {
  name: string
  company: string
  initials: string
  rating: number
  text: string
  time: string
}

export const REVIEWS: Review[] = [
  { name: 'John Davis',   company: 'Riverside Manufacturing', initials: 'JD', rating: 5, text: 'Excellent quality products. The team was responsive and delivery was ahead of schedule.',                           time: '2 weeks ago'  },
  { name: 'Sarah Kim',    company: 'Northgate Logistics',     initials: 'SK', rating: 4, text: 'Great IoT solutions. Setup took a bit longer than expected but the support team made it painless.',               time: '1 month ago'  },
  { name: 'Marcus Webb',  company: 'Apex Build Group',        initials: 'MW', rating: 5, text: 'Reliable partner. Have used them for 3 projects now and they keep delivering.',                                   time: '3 months ago' },
]

export interface Plan {
  name: string
  price: number
  period: string
  features: string[]
  recommended?: boolean
}

export const PLANS: Plan[] = [
  { name: 'Free',         price: 0,     period: 'forever',                 features: ['Business profile', 'Up to 10 products', 'Mini website', 'Email inquiries', 'Basic analytics'] },
  { name: 'Monthly Pro',  price: 29500, period: 'month',                   features: ['Everything in Free', 'Unlimited products', 'RFQ marketplace access', 'Advanced analytics', 'Product video', 'Direct sales'] },
  { name: 'Annual Pro',   price: 23500, period: 'month, billed annually',  features: ['Everything in Monthly Pro', 'Featured listings', 'Premium ads & boost', 'Custom pages', 'API access', 'Priority support'], recommended: true },
]

// Shared industry list — used in auth screens, register page, and profile edit
// Aligned with CATEGORIES; includes broader options for buyer profiles
export const INDUSTRIES = [
  'Manufacturing',
  'Technology',
  'Construction',
  'Logistics',
  'Food & Beverage',
  'Professional Services',
  'Retail & Wholesale',
  'Agriculture',
  'Healthcare',
  'Education',
  'Hospitality & Tourism',
  'Finance & Insurance',
  'Apparel & Textiles',
  'Export & Import',
  'Printing & Packaging',
  'Real Estate & Property',
  'Energy & Utilities',
  'Media & Communications',
  'Other',
]

export interface UserProfile {
  // ── Personal information ──────────────────────────────────
  fullName:  string
  email:     string
  phone:     string
  logo:      string   // initials auto-computed from fullName

  // ── Business information (optional buyers / required sellers) ──
  businessName:     string
  businessIndustry: string
  businessWebsite:  string
  businessPhone:    string
  description:      string   // public brand description (sellers)

  // ── Brand metadata (sellers only) ────────────────────────
  brandId?:   string
  brandSlug?: string

  // ── UI preference ─────────────────────────────────────────
  bannerColor: string
  role?: 'buyer' | 'seller'
  avatarUrl?: string   // personal profile photo
  logoUrl?: string     // brand/business logo
}

export type Screen =
  | 'home' | 'listing' | 'detail' | 'product-detail' | 'saved'
  | 'rfqs' | 'rfq-create' | 'rfq-detail'
  | 'messages' | 'message-form'
  | 'success'
  | 'profile' | 'manage-profile' | 'manage-products' | 'add-product' | 'edit-product'
  | 'settings' | 'subscription'
  | 'notifications'
  | 'auth'
  | 'about' | 'privacy' | 'contact'

export interface NavOpts {
  // Explore filters
  category?: string
  tab?: string
  // RFQ navigation context
  brandId?: string
  brandName?: string
  productId?: string
  rfqId?: string
  successContext?: 'rfq' | 'message'
}

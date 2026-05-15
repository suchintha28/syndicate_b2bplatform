import { client } from './client'

// ── Types ────────────────────────────────────────────────────────────────────

export interface SanityBanner {
  title:     string | null
  subtitle:  string | null
  ctaText:   string | null
  ctaUrl:    string | null
  imageUrl:  string | null
  bgColor:   string | null
  textColor: string | null
}

export interface SanityAboutPage {
  eyebrow:     string
  title:       string
  subtitle:    string
  whyTitle:    string
  whyBody:     unknown[]   // Portable Text blocks
  stats:       Array<{ num: string; label: string }>
  valuesTitle: string
  values:      Array<{ icon: string; title: string; body: string }>
  whereTitle:  string
  whereBody:   unknown[]
  ctaTitle:    string
  ctaBody:     string
  ctaLabel:    string
}

export interface SanityPrivacyPage {
  lastUpdated: string | null
  sections: Array<{
    id:    { current: string }
    title: string
    body:  unknown[]
  }>
}

export interface SanityContactPage {
  eyebrow:      string
  title:        string
  subtitle:     string
  methods:      Array<{ icon: string; label: string; value: string; sub: string }>
  formTitle:    string
  formSubtitle: string
  topicOptions: string[]
}

export interface SanitySiteSettings {
  siteName:        string
  tagline:         string
  footerTagline:   string
  footerCopyright: string
  contact: {
    email:        string
    salesEmail:   string
    privacyEmail: string
    phone:        string
    address:      string
    supportHours: string
  }
  social: Array<{ platform: string; url: string }>
}

// ── Queries ──────────────────────────────────────────────────────────────────

/** Active banner for a given slot, respecting date windows. */
export async function fetchSanityBanner(slot: string): Promise<SanityBanner | null> {
  const now = new Date().toISOString()
  return client.fetch<SanityBanner | null>(
    `*[_type == "banner" && slot == $slot && isActive == true
       && (!defined(startsAt) || startsAt <= $now)
       && (!defined(endsAt)   || endsAt   >= $now)
    ] | order(sortOrder asc) [0] {
      title,
      subtitle,
      "ctaText": ctaText,
      "ctaUrl":  ctaUrl,
      "imageUrl": image.asset->url,
      bgColor,
      textColor
    }`,
    { slot, now },
    { next: { revalidate: 300 } }  // 5-minute CDN cache
  )
}

export async function fetchAboutPage(): Promise<SanityAboutPage | null> {
  return client.fetch<SanityAboutPage | null>(
    `*[_type == "aboutPage" && _id == "aboutPage"][0]`,
    {},
    { next: { revalidate: 3600 } }
  )
}

export async function fetchPrivacyPage(): Promise<SanityPrivacyPage | null> {
  return client.fetch<SanityPrivacyPage | null>(
    `*[_type == "privacyPage" && _id == "privacyPage"][0] {
      lastUpdated,
      sections[] { id, title, body }
    }`,
    {},
    { next: { revalidate: 3600 } }
  )
}

export async function fetchContactPage(): Promise<SanityContactPage | null> {
  return client.fetch<SanityContactPage | null>(
    `*[_type == "contactPage" && _id == "contactPage"][0]`,
    {},
    { next: { revalidate: 3600 } }
  )
}

export async function fetchSiteSettings(): Promise<SanitySiteSettings | null> {
  return client.fetch<SanitySiteSettings | null>(
    `*[_type == "siteSettings" && _id == "siteSettings"][0]`,
    {},
    { next: { revalidate: 3600 } }
  )
}

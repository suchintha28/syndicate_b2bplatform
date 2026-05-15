import type { StructureResolver } from 'sanity/structure'

/**
 * Custom studio structure:
 * – Singletons (About, Privacy, Contact, Site settings) open directly without a list view
 * – Banners live in a dedicated section
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // ── Singletons ──────────────────────────────────────────────────
      S.listItem()
        .title('Site settings')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),

      S.divider(),

      S.listItem()
        .title('About page')
        .id('aboutPage')
        .child(S.document().schemaType('aboutPage').documentId('aboutPage')),

      S.listItem()
        .title('Privacy policy page')
        .id('privacyPage')
        .child(S.document().schemaType('privacyPage').documentId('privacyPage')),

      S.listItem()
        .title('Contact page')
        .id('contactPage')
        .child(S.document().schemaType('contactPage').documentId('contactPage')),

      S.divider(),

      // ── Featured Merchants (singleton) ───────────────────────────────
      S.listItem()
        .title('Featured Merchants')
        .id('featuredMerchants')
        .child(S.document().schemaType('featuredMerchants').documentId('featuredMerchants')),

      S.divider(),

      // ── Banners (multiple documents) ────────────────────────────────
      S.listItem()
        .title('Marketing banners')
        .child(
          S.documentTypeList('banner')
            .title('Marketing banners')
            .defaultOrdering([{ field: 'slot', direction: 'asc' }, { field: 'sortOrder', direction: 'asc' }])
        ),
    ])

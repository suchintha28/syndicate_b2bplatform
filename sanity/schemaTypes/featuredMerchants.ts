import { defineType, defineField } from 'sanity'

/**
 * Featured Merchants — singleton document that controls which brands appear
 * in the "Discover suppliers" section on the marketplace home page.
 *
 * Admin workflow:
 *  1. Open Sanity Studio → Featured Merchants
 *  2. Add or remove brand slugs (find the slug on the brand's Supabase record)
 *  3. Publish — the home page picks up the change within 5 minutes (CDN TTL)
 *
 * Maximum 6 brands can be featured at once to keep the grid balanced.
 */
export const featuredMerchantsType = defineType({
  name:  'featuredMerchants',
  type:  'document',
  title: 'Featured Merchants',
  fields: [
    defineField({
      name:        'title',
      type:        'string',
      title:       'Section heading',
      description: 'Overrides the default "Discover suppliers" heading on the home page.',
      initialValue: 'Discover suppliers',
    }),
    defineField({
      name:        'slugs',
      type:        'array',
      title:       'Brand slugs (max 6)',
      description: 'Paste each brand\'s slug exactly as it appears in Supabase (e.g. "acme-electronics"). The order here controls the order shown on the site.',
      of: [
        {
          type:  'object',
          title: 'Brand',
          fields: [
            defineField({
              name:        'slug',
              type:        'string',
              title:       'Brand slug',
              description: 'Exact slug from the brands table in Supabase.',
              validation:  (R) => R.required().min(2).max(100),
            }),
            defineField({
              name:        'label',
              type:        'string',
              title:       'Label (optional)',
              description: 'Display name for reference only — not shown on site.',
            }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'slug' },
            prepare: ({ title, subtitle }: { title?: string; subtitle?: string }) => ({
              title: title || subtitle || 'Unnamed brand',
              subtitle: subtitle ? `slug: ${subtitle}` : undefined,
            }),
          },
        },
      ],
      validation: (R) => R.max(6).warning('Featured section shows a maximum of 6 brands.'),
    }),
  ],
  preview: {
    select: { title: 'title', slugs: 'slugs' },
    prepare: ({ title, slugs }: { title?: string; slugs?: unknown[] }) => ({
      title:    title || 'Featured Merchants',
      subtitle: `${(slugs ?? []).length} brand${(slugs ?? []).length === 1 ? '' : 's'} featured`,
    }),
  },
})

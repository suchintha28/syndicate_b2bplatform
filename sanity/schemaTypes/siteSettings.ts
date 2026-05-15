import { defineField, defineType } from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: () => '⚙️',
  // Singleton — only one document of this type
  fields: [
    defineField({ name: 'siteName',  title: 'Site / company name', type: 'string', initialValue: 'Syndicate' }),
    defineField({ name: 'tagline',   title: 'Tagline',             type: 'string', initialValue: 'The B2B network built for serious buyers.' }),

    defineField({
      name: 'contact',
      title: 'Contact details',
      type: 'object',
      fields: [
        { name: 'email',        type: 'string', title: 'General email',     initialValue: 'hello@syndicate.example' },
        { name: 'salesEmail',   type: 'string', title: 'Sales email',       initialValue: 'sales@syndicate.example' },
        { name: 'privacyEmail', type: 'string', title: 'Privacy email',     initialValue: 'privacy@syndicate.example' },
        { name: 'phone',        type: 'string', title: 'Phone',             initialValue: '+94 11 555 0188' },
        { name: 'address',      type: 'text',   title: 'Office address', rows: 2 },
        { name: 'supportHours', type: 'string', title: 'Support hours',     initialValue: 'Mon–Fri, 09:00–18:00 Asia/Colombo' },
      ],
    }),

    defineField({
      name: 'social',
      title: 'Social links',
      type: 'array',
      of: [
        defineField({
          name: 'link',
          type: 'object',
          fields: [
            { name: 'platform', type: 'string', title: 'Platform', description: 'e.g. LinkedIn, Twitter/X, Instagram' },
            { name: 'url',      type: 'url',    title: 'URL' },
          ],
          preview: { select: { title: 'platform', subtitle: 'url' } },
        }),
      ],
    }),

    defineField({
      name: 'footerTagline',
      title: 'Footer tagline',
      type: 'string',
      initialValue: 'The B2B network built for serious buyers.',
    }),
    defineField({
      name: 'footerCopyright',
      title: 'Footer copyright line',
      type: 'string',
      initialValue: '© 2026 Syndicate. All rights reserved.',
    }),
  ],
})

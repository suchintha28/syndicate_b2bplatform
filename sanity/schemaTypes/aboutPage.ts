import { defineField, defineType } from 'sanity'

export const aboutPageType = defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  icon: () => '🏢',
  // Singleton — only one document of this type should exist
  fields: [
    defineField({ name: 'eyebrow',  title: 'Eyebrow label', type: 'string', initialValue: 'About us' }),
    defineField({ name: 'title',    title: 'Page title',    type: 'string', initialValue: 'The supply chain, rewired.' }),
    defineField({ name: 'subtitle', title: 'Subtitle',      type: 'string' }),

    defineField({
      name: 'whyTitle',
      title: '"Why we built this" heading',
      type: 'string',
      initialValue: 'Why we built this',
    }),
    defineField({
      name: 'whyBody',
      title: '"Why we built this" text',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Rich text — bold, italic, and links are supported.',
    }),

    defineField({
      name: 'stats',
      title: 'Stats strip',
      type: 'array',
      of: [
        defineField({
          name: 'stat',
          type: 'object',
          fields: [
            { name: 'num',   type: 'string', title: 'Number / value', description: 'e.g. 1,247 or $2.4B' },
            { name: 'label', type: 'string', title: 'Label' },
          ],
          preview: { select: { title: 'num', subtitle: 'label' } },
        }),
      ],
    }),

    defineField({
      name: 'valuesTitle',
      title: '"What we believe" heading',
      type: 'string',
      initialValue: 'What we believe',
    }),
    defineField({
      name: 'values',
      title: 'Value cards',
      type: 'array',
      of: [
        defineField({
          name: 'value',
          type: 'object',
          fields: [
            { name: 'icon',  type: 'string', title: 'Icon name', description: 'check · zap · message · sparkle · lock · star' },
            { name: 'title', type: 'string', title: 'Card title' },
            { name: 'body',  type: 'text',   title: 'Card body', rows: 2 },
          ],
          preview: { select: { title: 'title' } },
        }),
      ],
    }),

    defineField({
      name: 'whereTitle',
      title: '"Where we are" heading',
      type: 'string',
      initialValue: 'Where we are',
    }),
    defineField({
      name: 'whereBody',
      title: '"Where we are" text',
      type: 'array',
      of: [{ type: 'block' }],
    }),

    defineField({ name: 'ctaTitle', title: 'CTA card headline',  type: 'string', initialValue: 'Ready to source smarter?' }),
    defineField({ name: 'ctaBody',  title: 'CTA card body text', type: 'string', initialValue: 'Post your first RFQ in under five minutes.' }),
    defineField({ name: 'ctaLabel', title: 'CTA button label',   type: 'string', initialValue: 'Create RFQ' }),
  ],
})

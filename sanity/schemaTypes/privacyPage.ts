import { defineField, defineType } from 'sanity'

export const privacyPageType = defineType({
  name: 'privacyPage',
  title: 'Privacy policy page',
  type: 'document',
  icon: () => '🔒',
  fields: [
    defineField({ name: 'lastUpdated', title: 'Last updated', type: 'date', description: 'Displayed at the top of the page.' }),
    defineField({
      name: 'sections',
      title: 'Policy sections',
      type: 'array',
      description: 'Each section becomes one numbered entry in the table of contents.',
      of: [
        defineField({
          name: 'section',
          type: 'object',
          fields: [
            { name: 'id',    type: 'slug', title: 'Anchor ID', description: 'Auto-generated from the title. Used for in-page links.' },
            { name: 'title', type: 'string', title: 'Section title' },
            { name: 'body',  type: 'array', title: 'Section text', of: [{ type: 'block' }] },
          ],
          preview: { select: { title: 'title' } },
        }),
      ],
    }),
  ],
})

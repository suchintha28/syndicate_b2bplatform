import { defineField, defineType } from 'sanity'

const ICON_OPTIONS = [
  { title: 'Mail',    value: 'mail' },
  { title: 'Phone',   value: 'phone' },
  { title: 'Chat',    value: 'message' },
  { title: 'Pin',     value: 'pin' },
  { title: 'Globe',   value: 'globe' },
  { title: 'Twitter', value: 'twitter' },
]

export const contactPageType = defineType({
  name: 'contactPage',
  title: 'Contact page',
  type: 'document',
  icon: () => '📬',
  fields: [
    defineField({ name: 'eyebrow',  title: 'Eyebrow label', type: 'string', initialValue: 'Contact us' }),
    defineField({ name: 'title',    title: 'Page title',    type: 'string', initialValue: 'Talk to a human.' }),
    defineField({ name: 'subtitle', title: 'Subtitle',      type: 'string', initialValue: 'Sales, partnerships, press, or a stuck order — pick the right channel below or send us a note.' }),

    defineField({
      name: 'methods',
      title: 'Contact methods',
      type: 'array',
      description: 'Each entry appears as a contact card on the left column of the page.',
      of: [
        defineField({
          name: 'method',
          type: 'object',
          fields: [
            { name: 'icon',  type: 'string', title: 'Icon', options: { list: ICON_OPTIONS, layout: 'radio' } },
            { name: 'label', type: 'string', title: 'Label',    description: 'e.g. Email' },
            { name: 'value', type: 'string', title: 'Value',    description: 'e.g. hello@syndicate.example or +94 11 555 0188' },
            { name: 'sub',   type: 'string', title: 'Sub-text', description: 'e.g. We reply within one business day.' },
          ],
          preview: { select: { title: 'label', subtitle: 'value' } },
        }),
      ],
    }),

    defineField({
      name: 'formTitle',
      title: 'Form card title',
      type: 'string',
      initialValue: 'Send us a message',
    }),
    defineField({
      name: 'formSubtitle',
      title: 'Form card subtitle',
      type: 'string',
    }),
    defineField({
      name: 'topicOptions',
      title: 'Enquiry topic options',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Dropdown options in the contact form.',
    }),
  ],
})

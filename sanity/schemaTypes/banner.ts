import { defineField, defineType } from 'sanity'

const SLOTS = [
  { title: 'Homepage — below hero',          value: 'home_hero' },
  { title: 'Brand page — below about',       value: 'brand_about' },
  { title: 'Product page — below gallery',   value: 'product_gallery' },
  { title: 'Explore page — below heading',   value: 'explore_heading' },
]

export const bannerType = defineType({
  name: 'banner',
  title: 'Marketing Banner',
  type: 'document',
  icon: () => '📢',
  fields: [
    defineField({
      name: 'slot',
      title: 'Banner slot',
      type: 'string',
      description: 'Where on the site this banner appears.',
      options: { list: SLOTS, layout: 'radio' },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: false,
      description: 'Turn this off to hide the banner without deleting it.',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Priority',
      type: 'number',
      initialValue: 0,
      description: 'Lower number = shown first when multiple banners share a slot.',
    }),
    defineField({
      name: 'title',
      title: 'Headline',
      type: 'string',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtext',
      type: 'string',
    }),
    defineField({
      name: 'ctaText',
      title: 'Button label',
      type: 'string',
      description: 'e.g. "Shop now", "Learn more". Leave blank for no button.',
    }),
    defineField({
      name: 'ctaUrl',
      title: 'Button URL',
      type: 'url',
      description: 'Full URL the button links to.',
    }),
    defineField({
      name: 'image',
      title: 'Background image',
      type: 'image',
      description: 'Optional. Overrides the background colour below.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'bgColor',
      title: 'Background colour',
      type: 'string',
      initialValue: '#1a1a2e',
      description: 'Hex colour used when no image is set. e.g. #1a1a2e',
    }),
    defineField({
      name: 'textColor',
      title: 'Text colour',
      type: 'string',
      initialValue: '#ffffff',
      description: 'Hex colour for all text on this banner.',
    }),
    defineField({
      name: 'startsAt',
      title: 'Show from',
      type: 'datetime',
      description: 'Leave blank to show immediately when Active is on.',
    }),
    defineField({
      name: 'endsAt',
      title: 'Hide after',
      type: 'datetime',
      description: 'Leave blank to show indefinitely.',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'slot', active: 'isActive' },
    prepare({ title, subtitle, active }) {
      const slotLabel = SLOTS.find(s => s.value === subtitle)?.title ?? subtitle
      return {
        title: title || '(untitled banner)',
        subtitle: `${slotLabel} · ${active ? '✅ Active' : '⏸ Inactive'}`,
      }
    },
  },
})

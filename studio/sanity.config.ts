import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from '../sanity/schemaTypes'
import { structure } from '../sanity/structure'

export default defineConfig({
  name: 'syndicate-cms',
  title: 'Syndicate CMS',

  projectId: 'mx1vcbbk',
  dataset: 'production',

  plugins: [
    structureTool({ structure }),
    visionTool(),
  ],

  schema: { types: schemaTypes },

  // Force Vite to use a single React instance (this studio's React 19).
  // Without this, schema files imported from ../sanity/schemaTypes resolve
  // React from the parent project's node_modules (React 18), which lacks
  // the ./compiler-runtime export that Sanity v5.25+ requires.
  vite: {
    resolve: {
      dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
})

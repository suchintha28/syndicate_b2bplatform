import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'mx1vcbbk',
    dataset: 'production',
  },
  studioHost: 'syndicate-cms',   // → https://syndicate-cms.sanity.studio
})

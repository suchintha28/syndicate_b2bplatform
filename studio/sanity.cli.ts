import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'mx1vcbbk',
    dataset: 'production',
  },
  studioHost: 'syndicate-cms',  // → https://syndicate-cms.sanity.studio
  deployment: {
    appId: 'mnftj2rmgcde3cq73p40jwhg',
  },
})

'use client'

/**
 * Sanity Studio embedded at /studio
 *
 * Access: yoursite.com/studio
 * To restrict access, wrap with your auth check or add Sanity's own
 * access-control settings in the Sanity dashboard.
 */
import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config'

export default function StudioPage() {
  return <NextStudio config={config} />
}

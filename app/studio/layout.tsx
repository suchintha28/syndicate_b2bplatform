/**
 * The studio has its own layout that intentionally omits the app's
 * navigation, footer, and font variables — Sanity Studio manages its own UI.
 */
export const metadata = { title: 'Syndicate CMS' }

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

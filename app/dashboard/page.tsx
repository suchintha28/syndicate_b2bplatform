import { redirect } from 'next/navigation'

// The dashboard has been merged into the Profile screen inside the main SPA.
// Any direct links to /dashboard are redirected to the home page.
export default function DashboardPage() {
  redirect('/')
}

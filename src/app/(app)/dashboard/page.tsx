import { redirect } from 'next/navigation'

/**
 * /dashboard is now /editor.
 * Redirect permanently so bookmarks update.
 */
export default function DashboardPage() {
  redirect('/editor')
}

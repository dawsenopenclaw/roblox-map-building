import { redirect } from 'next/navigation'

/** Voice input is now built into the editor chat bar. */
export default function VoicePage() {
  redirect('/editor')
}

import { redirect } from 'next/navigation'

/** Game DNA is now the DNA panel in the editor. */
export default function GameDnaPage() {
  redirect('/editor')
}

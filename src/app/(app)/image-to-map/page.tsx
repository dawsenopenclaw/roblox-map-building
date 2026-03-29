import { redirect } from 'next/navigation'

/** Image-to-map is now handled via the editor chat. */
export default function ImageToMapPage() {
  redirect('/editor')
}

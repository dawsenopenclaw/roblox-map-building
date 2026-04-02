import type { Metadata } from 'next'
import { ProjectsClient } from './ProjectsClient'

export const metadata: Metadata = {
  title: 'Projects — ForjeGames',
  description: 'Your saved Roblox game projects',
}

export default function ProjectsPage() {
  return <ProjectsClient />
}

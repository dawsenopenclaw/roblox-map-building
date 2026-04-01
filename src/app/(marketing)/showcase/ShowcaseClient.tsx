'use client'

import dynamic from 'next/dynamic'

// Dynamically import Three.js component to avoid SSR issues
const AssetShowcase3D = dynamic(() => import('@/components/AssetShowcase3D'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 520,
      color: 'rgba(212,175,55,0.6)',
      fontSize: 14,
    }}>
      Loading 3D viewer...
    </div>
  ),
})

export default function ShowcaseClient() {
  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: 100,
      paddingBottom: 80,
    }}>
      <AssetShowcase3D />
    </div>
  )
}

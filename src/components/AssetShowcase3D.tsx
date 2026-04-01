'use client'

import React, { Suspense, useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================
// Asset data
// ============================================================

interface AssetInfo {
  name: string
  file: string
  category: 'wagon' | 'prop' | 'decoration'
  description: string
}

const ASSETS: AssetInfo[] = [
  { name: 'Covered Wagon', file: 'Covered_Wagon.glb', category: 'wagon', description: 'Large wagon with fabric canopy — perfect for merchant caravans' },
  { name: 'Cargo Wagon', file: 'Cargo_Wagon.glb', category: 'wagon', description: 'Heavy-duty cargo hauler with high plank sides' },
  { name: 'Flatbed Wagon', file: 'Flatbed_Wagon.glb', category: 'wagon', description: 'Open flatbed for transporting goods and materials' },
  { name: 'Barrel Cart', file: 'Barrel_Cart.glb', category: 'wagon', description: 'Single-wheel barrow with barrel storage' },
  { name: 'Open Cart', file: 'Open_Cart.glb', category: 'wagon', description: 'Lightweight handcart for quick deliveries' },
  { name: 'Market Tent', file: 'Market_Tent_1.glb', category: 'decoration', description: 'Fabric-topped market stall with built-in table' },
  { name: 'Umbrella', file: 'Umbrella_1.glb', category: 'decoration', description: 'Decorative parasol for outdoor market vibes' },
  { name: 'Signboard', file: 'Signboard_1.glb', category: 'decoration', description: 'Hanging wooden sign on iron chain' },
  { name: 'Display Table', file: 'Table_1.glb', category: 'decoration', description: 'Sturdy merchant display table' },
  { name: 'Display Case', file: 'Display_Case_1.glb', category: 'decoration', description: 'Glass-topped showcase for valuables' },
  { name: 'Barrel', file: 'Barrel_1.glb', category: 'prop', description: 'Banded wooden barrel — 2 variations included' },
  { name: 'Potted Plant', file: 'Plant_1.glb', category: 'prop', description: 'Terracotta pot with lush green foliage' },
  { name: 'Sack', file: 'Sack_1.glb', category: 'prop', description: 'Burlap sack tied with rope — 4 variations' },
  { name: 'Crate', file: 'Crate_1.glb', category: 'prop', description: 'Reinforced wooden crate — 2 sizes' },
  { name: 'Basket', file: 'Basket_1.glb', category: 'prop', description: 'Woven basket with carry handle' },
  { name: 'Shelf', file: 'Shelf_1.glb', category: 'prop', description: '3-tier wall shelf unit for displays' },
  { name: 'Bunting', file: 'Bunting_1.glb', category: 'decoration', description: 'Festive flag bunting in multiple colors' },
]

const CATEGORIES = [
  { key: 'all', label: 'All Assets' },
  { key: 'wagon', label: 'Wagons' },
  { key: 'prop', label: 'Props' },
  { key: 'decoration', label: 'Decorations' },
] as const

// ============================================================
// 3D Model Component
// ============================================================

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const ref = useRef<THREE.Group>(null)

  // Slow auto-rotate
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.3
    }
  })

  // Center and scale the model
  React.useEffect(() => {
    if (ref.current) {
      const box = new THREE.Box3().setFromObject(ref.current)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 2.5 / maxDim
      ref.current.scale.setScalar(scale)
      ref.current.position.set(-center.x * scale, -center.y * scale + 0.2, -center.z * scale)
    }
  }, [scene])

  return (
    <group ref={ref}>
      <primitive object={scene.clone()} />
    </group>
  )
}

function LoadingSpinner() {
  return (
    <Html center>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: 'rgba(212,175,55,0.8)',
        fontSize: 14,
        fontFamily: 'system-ui',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Loading model...
      </div>
    </Html>
  )
}

// ============================================================
// Main Showcase Component
// ============================================================

export default function AssetShowcase3D() {
  const [selectedAsset, setSelectedAsset] = useState<AssetInfo>(ASSETS[0])
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const filteredAssets = activeCategory === 'all'
    ? ASSETS
    : ASSETS.filter(a => a.category === activeCategory)

  return (
    <section style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={{
          display: 'inline-block',
          padding: '4px 14px',
          borderRadius: 9999,
          border: '1px solid rgba(212,175,55,0.25)',
          background: 'rgba(212,175,55,0.06)',
          color: 'rgba(212,175,55,0.9)',
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '0.02em',
          marginBottom: 16,
        }}>
          3D Asset Pack
        </span>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1.15,
          margin: '0 0 12px',
        }}>
          Medieval Marketplace Pack
        </h2>
        <p style={{
          fontSize: 16,
          color: 'rgba(255,255,255,0.5)',
          maxWidth: 560,
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          25+ stylized low-poly assets — wagons, market stalls, props, and decorations.
          Built with AI-assisted Blender pipeline, ready for Roblox.
        </p>
      </div>

      {/* Main viewer layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: 20,
        minHeight: 520,
      }}>
        {/* 3D Viewport */}
        <div style={{
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(145deg, rgba(15,18,35,0.95), rgba(8,10,22,0.98))',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Asset name overlay */}
          <div style={{
            position: 'absolute',
            top: 16,
            left: 20,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'rgba(212,175,55,0.8)',
              boxShadow: '0 0 8px rgba(212,175,55,0.4)',
            }} />
            <span style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}>
              {selectedAsset.name}
            </span>
          </div>

          {/* Controls hint */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 20,
            zIndex: 10,
            color: 'rgba(255,255,255,0.3)',
            fontSize: 12,
          }}>
            Drag to rotate · Scroll to zoom
          </div>

          <Canvas
            camera={{ position: [4, 3, 4], fov: 40 }}
            style={{ height: 520, background: 'transparent' }}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 8, 5]} intensity={1.2} color="#fff5e6" castShadow />
            <directionalLight position={[-3, 4, -2]} intensity={0.4} color="#e0e8ff" />

            <Suspense fallback={<LoadingSpinner />}>
              <Model
                key={selectedAsset.file}
                url={`/models/marketplace-pack/${selectedAsset.file}`}
              />
              <ContactShadows
                position={[0, -0.8, 0]}
                opacity={0.35}
                scale={8}
                blur={2.5}
                far={4}
                color="#000"
              />
              <Environment preset="city" />
            </Suspense>

            <OrbitControls
              enablePan={false}
              minDistance={2}
              maxDistance={10}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2.1}
              autoRotate={false}
            />
          </Canvas>
        </div>

        {/* Asset sidebar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {/* Category tabs */}
          <div style={{
            display: 'flex',
            gap: 6,
            padding: 4,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  transition: 'all 200ms',
                  background: activeCategory === cat.key ? 'rgba(212,175,55,0.12)' : 'transparent',
                  color: activeCategory === cat.key ? 'rgba(212,175,55,0.95)' : 'rgba(255,255,255,0.4)',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Asset list */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            paddingRight: 4,
          }}>
            {filteredAssets.map(asset => (
              <button
                key={asset.file}
                onClick={() => setSelectedAsset(asset)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: selectedAsset.file === asset.file
                    ? '1px solid rgba(212,175,55,0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                  background: selectedAsset.file === asset.file
                    ? 'rgba(212,175,55,0.06)'
                    : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 200ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: selectedAsset.file === asset.file ? '#fff' : 'rgba(255,255,255,0.75)',
                  }}>
                    {asset.name}
                  </span>
                  <span style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.35)',
                    textTransform: 'capitalize',
                  }}>
                    {asset.category}
                  </span>
                </div>
                <span style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.35)',
                  lineHeight: 1.4,
                }}>
                  {asset.description}
                </span>
              </button>
            ))}
          </div>

          {/* Pack stats */}
          <div style={{
            padding: '14px 16px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Assets', value: '26' },
                { label: 'Triangles', value: '~208K' },
                { label: 'Format', value: 'GLB / FBX' },
                { label: 'Style', value: 'Stylized' },
              ].map(stat => (
                <div key={stat.label}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

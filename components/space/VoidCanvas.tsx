'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { useMemo } from 'react'
function Planet({ color }: { color: string }) {
  return (
    <mesh rotation={[0.2, 0, 0]}>
      <sphereGeometry args={[1.1, 48, 48]} />
      <meshStandardMaterial color={color} roughness={0.65} metalness={0.1} />
    </mesh>
  )
}

function OrbitMoons({ count, active }: { count: number; active: boolean }) {
  const moons = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2
      return { angle, i }
    })
  }, [count])

  return (
    <group>
      {moons.map(({ angle, i }) => (
        <mesh key={i} position={[Math.cos(angle) * 2.4, Math.sin(angle) * 0.35, Math.sin(angle) * 0.8]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color={active && i < 2 ? '#2457C5' : '#334155'} />
        </mesh>
      ))}
    </group>
  )
}

function Portals() {
  const portals = [-2.2, -0.7, 0.7, 2.2]
  return (
    <group>
      {portals.map((x, i) => (
        <mesh key={x} position={[x, 0, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.07, 12, 48]} />
          <meshStandardMaterial color={i === 2 ? '#2457C5' : '#1e293b'} />
        </mesh>
      ))}
    </group>
  )
}

export type VoidScene = 'multiverse' | 'universe' | 'planet'

export function VoidCanvas({ scene, planetColor = '#08756B' }: { scene: VoidScene; planetColor?: string }) {
  const cameraZ = scene === 'multiverse' ? 7 : scene === 'universe' ? 5 : 3.5
  return (
    <Canvas
      camera={{ position: [0, 0.6, cameraZ], fov: 50 }}
      style={{ width: '100%', height: '100%', minHeight: 360 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0b0f17']} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 8]} intensity={1.1} />
      <Stars radius={80} depth={40} count={1200} factor={2} saturation={0} fade speed={0.2} />
      {scene === 'multiverse' && <Portals />}
      {scene === 'universe' && <Planet color={planetColor} />}
      {scene === 'planet' && (
        <group>
          <Planet color={planetColor} />
          <OrbitMoons count={5} active />
        </group>
      )}
      <OrbitControls enablePan={false} enableZoom={false} autoRotate={scene === 'planet'} autoRotateSpeed={0.4} />
    </Canvas>
  )
}

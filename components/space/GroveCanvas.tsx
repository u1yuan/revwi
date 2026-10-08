'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Shape } from 'three'

export type GroveScene = 'years' | 'courses' | 'assessments'

function CameraFit() {
  const { camera, size } = useThree()
  useEffect(() => {
    if (!('zoom' in camera)) return
    camera.zoom = Math.min(size.width / 17, size.height / 8.5)
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

function Land({ points, color, z = 0 }: { points: [number, number][]; color: string; z?: number }) {
  const shape = useMemo(() => {
    const path = new Shape()
    points.forEach(([x, y], index) => index ? path.lineTo(x, y) : path.moveTo(x, y))
    path.closePath()
    return path
  }, [points])
  return (
    <mesh position={[0, 0, z]}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

function Tree({ x, y, scale = 1, far = false }: { x: number; y: number; scale?: number; far?: boolean }) {
  return (
    <group position={[x, y, far ? -2 : 1]} scale={scale}>
      <mesh position={[0, 0.66, 0]}>
        <boxGeometry args={[0.18, 1.3, 0.16]} />
        <meshBasicMaterial color={far ? '#203e51' : '#354d42'} />
      </mesh>
      {([-0.43, 0, 0.42] as const).map((offset, i) => (
        <mesh key={offset} position={[offset, 1.48 + (i === 1 ? 0.2 : 0), 0]} scale={[0.72, 0.52, 0.3]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial color={far ? '#2c5464' : i === 1 ? '#376b56' : '#295746'} />
        </mesh>
      ))}
    </group>
  )
}

function Gate({ x, lit = false, wide = false }: { x: number; lit?: boolean; wide?: boolean }) {
  const width = wide ? 2.4 : 1.5
  return (
    <group position={[x, -1.34, 1.5]}>
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[width - 0.38, 1.75, 0.25]} />
        <meshBasicMaterial color={lit ? '#0b615f' : '#243948'} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2 - 0.12), 0.88, 0.12]}>
          <boxGeometry args={[0.28, 2, 0.3]} />
          <meshBasicMaterial color={lit ? '#8d9588' : '#596575'} />
        </mesh>
      ))}
      <mesh position={[0, 1.96, 0.14]}>
        <boxGeometry args={[width + 0.15, 0.25, 0.35]} />
        <meshBasicMaterial color={lit ? '#a4a28d' : '#647181'} />
      </mesh>
      <mesh position={[0, 0.64, 0.15]} scale={[width / 2.5, 0.76, 1]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color={lit ? '#35a99d' : '#1d3040'} transparent opacity={lit ? 0.25 : 0.9} />
      </mesh>
      {lit && <pointLight color={wide ? '#f6c453' : '#31c5b7'} intensity={2.2} distance={3.2} position={[0, 0.9, 0.7]} />}
    </group>
  )
}

function Grove({ scene }: { scene: GroveScene }) {
  const yearScene = scene === 'years'
  const courseScene = scene === 'courses'
  return (
    <>
      <color attach="background" args={['#182d49']} />
      <Land points={[[-12, -1.2], [-9, 0.8], [-7, 0.1], [-4, 1.2], [-1, -0.1], [2, 1.1], [5, 0.2], [9, 1.4], [12, -0.5], [12, -5], [-12, -5]]} color="#294967" z={-5} />
      <Land points={[[-12, -1.7], [-9, -0.3], [-6, -1.2], [-3, 0.15], [0, -1.1], [3, 0.25], [6, -1.2], [9, -0.2], [12, -1.4], [12, -5], [-12, -5]]} color="#203e5a" z={-4} />
      {[-8, -6.5, -4.6, -2.5, 1.9, 4.8, 7.1, 9].map((x, i) => <Tree key={x} x={x} y={-1.9 + (i % 3) * 0.15} scale={0.8 + (i % 3) * 0.13} far />)}
      <Land points={[[-12, -2.25], [-8, -2.18], [-5, -2.33], [-2, -2.12], [1, -2.27], [4, -2.1], [7, -2.3], [12, -2.14], [12, -5], [-12, -5]]} color="#2b4b4d" z={-1} />
      <Land points={[[-12, -2.47], [-8, -2.39], [-5, -2.53], [-2, -2.32], [1, -2.49], [4, -2.3], [7, -2.5], [12, -2.36], [12, -5], [-12, -5]]} color="#60717a" z={0} />
      <Land points={[[-12, -2.58], [-8, -2.52], [-5, -2.66], [-2, -2.45], [1, -2.62], [4, -2.43], [7, -2.64], [12, -2.48], [12, -5], [-12, -5]]} color="#1b3441" z={0.2} />
      {[-7.4, -5.7, -3.4, 3.7, 6.2, 8.1].map((x, i) => <Tree key={x} x={x} y={-2.46} scale={i % 2 ? 0.82 : 1.12} />)}
      {yearScene ? [-5.2, -1.7, 1.8, 5.3].map((x, i) => <Gate key={x} x={x} lit={i === 2} />) : null}
      {courseScene ? <Gate x={0} lit wide /> : null}
      {scene === 'assessments' ? [-6, -3, 0, 3, 6].map((x, i) => <Gate key={x} x={x} lit={i === 1 || i === 2} wide={i === 2} />) : null}
      <CameraFit />
    </>
  )
}

export function GroveCanvas({ scene }: { scene: GroveScene }) {
  return (
    <Canvas orthographic camera={{ position: [0, 0, 20], near: 0.1, far: 100, zoom: 70 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: false }}>
      <Grove scene={scene} />
    </Canvas>
  )
}

'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import type { GroveScene } from './GroveCanvas'

const GroveCanvas = dynamic(() => import('./GroveCanvas').then((module) => module.GroveCanvas), { ssr: false })

function sceneForPath(pathname: string): GroveScene | null {
  if (pathname === '/') return 'years'
  if (/^\/u\/[^/]+\/?$/.test(pathname)) return 'courses'
  if (/^\/c\/[^/]+\/?$/.test(pathname)) return 'assessments'
  return null
}

export function GroveBackdrop() {
  const scene = sceneForPath(usePathname())
  return scene ? <div className="grove-world-layer" aria-hidden="true"><GroveCanvas scene={scene} /></div> : null
}

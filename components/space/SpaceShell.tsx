'use client'

import dynamic from 'next/dynamic'
import { FlightDeck } from './FlightDeck'
import { RouteMirror, type MirrorLink } from './RouteMirror'
import type { VoidScene } from './VoidCanvas'

const VoidCanvas = dynamic(() => import('./VoidCanvas').then((m) => m.VoidCanvas), { ssr: false })

export function SpaceShell({
  scene,
  planetColor,
  mirrorTitle,
  mirrorLinks,
  children,
}: {
  scene: VoidScene
  planetColor?: string
  mirrorTitle: string
  mirrorLinks: MirrorLink[]
  children?: React.ReactNode
}) {
  return (
    <div className="void-surface" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <FlightDeck />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr' }}>
        <RouteMirror title={mirrorTitle} links={mirrorLinks} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <VoidCanvas scene={scene} planetColor={planetColor} />
          {children ? (
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                left: 24,
                right: 24,
                pointerEvents: 'none',
              }}
            >
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

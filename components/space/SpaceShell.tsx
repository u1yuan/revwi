'use client'

import { useState } from 'react'
import { FlightDeck } from './FlightDeck'
import { RouteMirror, type MirrorLink } from './RouteMirror'
import type { GroveScene } from './GroveCanvas'
import './grove.css'

export function SpaceShell({ scene, context, mirrorTitle, mirrorLinks, children }: {
  scene: GroveScene
  context?: string
  mirrorTitle: string
  mirrorLinks: MirrorLink[]
  children: React.ReactNode
}) {
  const [listOpen, setListOpen] = useState(false)
  return (
    <div className={`grove-surface grove-${scene}`}>
      <FlightDeck context={context} listOpen={listOpen} onToggleList={() => setListOpen((value) => !value)} />
      <main className="grove-main">
        <div className="grove-content">{children}</div>
      </main>
      <RouteMirror title={mirrorTitle} links={mirrorLinks} open={listOpen} onClose={() => setListOpen(false)} />
    </div>
  )
}

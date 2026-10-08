'use client'

import { MotionConfig } from 'motion/react'
import App from '@/src/App'

export default function ReviewApp() {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: 'spring', bounce: 0.22, visualDuration: 0.34 }}>
      <div className="chronicle-surface">
        <App />
      </div>
    </MotionConfig>
  )
}

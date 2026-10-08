import './seedling.css'

export type SeedlingPose = 'idle' | 'curious' | 'celebrate' | 'support' | 'exam-neutral'

const poseLabel: Record<SeedlingPose, string> = {
  idle: 'resting',
  curious: 'curious',
  celebrate: 'celebrating',
  support: 'encouraging',
  'exam-neutral': 'resting',
}

export function SeedlingDock({ pose = 'curious', className = '' }: { pose?: SeedlingPose; className?: string }) {
  return (
    <aside className={`seedling-dock seedling-pose-${pose} ${className}`.trim()} aria-label={`Companion, ${poseLabel[pose]}`}>
      <span className="seedling-dock-label">Companion</span>
      <svg className="seedling-art" viewBox="0 0 150 155" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="seedling-body" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#bce7a2"/><stop offset="1" stopColor="#6ca77a"/></linearGradient>
          <linearGradient id="seedling-leaf" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b7e790"/><stop offset="1" stopColor="#348a69"/></linearGradient>
        </defs>
        <ellipse cx="73" cy="145" rx="45" ry="7" fill="#233d4a" opacity=".24" />
        <g className="seedling-character">
          <path className="seedling-left-leaf" d="M70 58 C38 49 28 32 33 17 C54 17 70 28 76 53 Z" fill="url(#seedling-leaf)" stroke="#2b6d57" strokeWidth="3" />
          <path className="seedling-right-leaf" d="M75 55 C78 26 97 13 118 16 C118 38 105 54 81 62 Z" fill="url(#seedling-leaf)" stroke="#2b6d57" strokeWidth="3" />
          <path d="M76 61 Q75 51 77 43" fill="none" stroke="#367b5b" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="48" cy="127" rx="13" ry="8" fill="#597d67" />
          <ellipse cx="100" cy="127" rx="13" ry="8" fill="#597d67" />
          <path d="M35 92 C35 65 53 54 75 54 C100 54 117 69 117 94 C117 117 100 132 75 132 C51 132 35 115 35 92 Z" fill="url(#seedling-body)" stroke="#3b8064" strokeWidth="3" />
          <path d="M46 112 Q75 127 106 111 L107 120 Q75 139 45 121 Z" fill="#2457c5" opacity=".95" />
          <path d="M46 116 Q74 128 106 115" fill="none" stroke="#9dc6ef" strokeWidth="2" opacity=".8" />
          <ellipse cx="60" cy="88" rx="5" ry="7" fill="#214b43" />
          <ellipse cx="91" cy="88" rx="5" ry="7" fill="#214b43" />
          <circle cx="62" cy="85" r="1.6" fill="white" />
          <circle cx="93" cy="85" r="1.6" fill="white" />
          <path className="seedling-mouth" d="M70 104 Q76 110 82 104" fill="none" stroke="#28594d" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="48" cy="100" rx="6" ry="3" fill="#e8aaa0" opacity=".45" />
          <ellipse cx="104" cy="100" rx="6" ry="3" fill="#e8aaa0" opacity=".45" />
        </g>
      </svg>
    </aside>
  )
}

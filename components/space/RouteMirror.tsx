import Link from 'next/link'

export type MirrorLink = { href: string; label: string; disabled?: boolean }

export function RouteMirror({ title, links }: { title: string; links: MirrorLink[] }) {
  return (
    <aside
      aria-label={title}
      style={{
        padding: 24,
        borderRight: '1px solid var(--void-border)',
        minWidth: 280,
        maxWidth: 320,
      }}
    >
      <h2 style={{ fontSize: 14, color: 'var(--void-muted)', marginBottom: 12 }}>{title}</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {links.map((link) => (
          <li key={link.href} style={{ marginBottom: 8 }}>
            {link.disabled ? (
              <span style={{ color: 'var(--void-muted)', fontSize: 15 }}>{link.label}</span>
            ) : (
              <Link href={link.href} style={{ color: '#2457C5', fontSize: 15, textDecoration: 'none' }}>
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </aside>
  )
}

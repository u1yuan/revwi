import Link from 'next/link'

export function FlightDeck() {
  return (
    <header
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid var(--void-border)',
      }}
    >
      <Link href="/" style={{ fontWeight: 600, letterSpacing: '-0.02em', color: 'inherit', textDecoration: 'none' }}>
        Revwi
      </Link>
      <nav style={{ display: 'flex', gap: 16, fontSize: 14 }}>
        <Link href="/admin" style={{ color: 'var(--void-muted)' }}>
          Admin
        </Link>
        <Link href="/sign-in" style={{ color: '#2457C5' }}>
          Sign in
        </Link>
      </nav>
    </header>
  )
}

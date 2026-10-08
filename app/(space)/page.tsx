import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { SpaceShell } from '@/components/space/SpaceShell'
import { staticCatalog } from '@/lib/catalog/static'

export default function MultiversePage() {
  const links = staticCatalog.map((year) => ({ href: `/u/${year.ordinal}`, label: year.name }))
  return (
    <SpaceShell scene="years" context="The Grove" mirrorTitle="Year levels" mirrorLinks={links}>
      <div className="grove-intro">
        <p className="grove-eyebrow">Your study path</p>
        <h1>Choose a year to explore.</h1>
        <p>Follow the grove to your course and pick an assessment to review.</p>
      </div>
      <div className="grove-year-links" aria-label="Year levels">
        {staticCatalog.map((year) => (
          <Link key={year.ordinal} href={`/u/${year.ordinal}`} className={`grove-year-link${year.courses.length ? ' is-active' : ''}`}>
            <span className="grove-year-number">0{year.ordinal}</span>
            <span className="grove-year-name">{year.name}</span>
            <span className="grove-year-note">{year.courses.length ? `${year.courses.length} course` : 'No courses yet'}</span>
            <ArrowRight size={20} aria-hidden className="grove-year-arrow" />
          </Link>
        ))}
      </div>
    </SpaceShell>
  )
}

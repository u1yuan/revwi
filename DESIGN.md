# Revwi design direction

<!-- impeccable:design-schema 1 -->

## Design read

Reading this as an **Operate** review app with an **Experience** navigation layer for students, plus an **Operate** admin console, with a **cold dark-space discovery** language for routing and a **light study cockpit** for questions, leaning toward Next.js, Tailwind v4, next/font, and the preserved Kahoot-inspired answer deck from DevNet Reviewer.

## Two surfaces

Revwi is intentionally split. Do not dark-mode the quiz or admin tables to match space navigation.

| Surface | Impeccable mode | Theme | Job |
| --- | --- | --- | --- |
| **Void** | Experience | Dark (`zinc-950` canvas, cobalt accent) | Multiverse, universe, planet, assessment picker |
| **Chronicle** | Operate | Light (`#F4F7FB` canvas, white stage) | Prep/Exam question flow, results, history |
| **Ledger** | Operate | Light neutral | Admin CRUD, publish workflow |

Void uses `@react-three/fiber` with `ssr: false`. Chronicle and Ledger are standard React client/server components with no WebGL.

## Configuration dials

Global defaults apply per surface, not per page.

| Surface | DESIGN_VARIANCE | MOTION_INTENSITY | VISUAL_DENSITY |
| --- | --- | --- | --- |
| Void | 8 | 7 | 3 |
| Chronicle | 4 | 5 | 5 |
| Ledger | 3 | 2 | 6 |

**Reduced motion:** Void crossfades and cuts camera moves; no idle planet spin. Chronicle keeps opacity fades only; no answer-tile shake. Ledger is static.

## Void visual system

### Atmosphere

- Background `#0B0F17` (not pure black). Starfield is sparse, low-contrast (`opacity ~0.35`), fixed layer with `pointer-events-none`.
- Primary accent **cobalt `#2457C5`** (same family as Chronicle actions). Secondary planet glow **teal `#08756B`** for DEVELOPMENT NETWORK only.
- No purple nebula gradients, no glass HUD chrome, no version labels, no scroll cues, no locale strips.

### Layout

- **Flight deck** top bar (max 64 px): Revwi wordmark left, signed-in user and Settings right. One line at `lg+`.
- Main viewport is full bleed below the bar. HTML **route mirror** sits in a visually hidden-but-focusable panel (`sr-only` is wrong; use off-screen or bottom sheet toggle "List view" on mobile).
- Empty year universes show a dim portal ring and the copy "No courses in this year yet." No fake planets.

### Orbit metaphor (chosen)

Assessments are **moons on one elliptical rail** around the course planet. Order on the rail: SA1, SA2, Midterm Exam, SA3, Final Exam.

- **Active moon:** full label, cobalt rim light, clickable.
- **Locked moon:** desaturated, dashed rail segment, `aria-disabled`, tooltip "Bank empty."
- **Planet:** procedural sphere from `courses.planet` json (palette, seed, atmosphere). Slow rotation only when motion allowed.

Camera: smooth eased flight between multiverse (four portals), universe (course planets), and planet (orbit dock). Duration ~1.2 s desktop, ~0.4 s when reduced motion.

### Typography (Void)

- **Geist** (via `next/font`) for labels and flight deck.
- Moon labels 14–16 px, medium weight, sentence case (not all caps eyebrows).

## Chronicle visual system

Inherit the verified DevNet Reviewer tokens and behavior unless noted.

| Role | Token | Use |
| --- | --- | --- |
| Study canvas | `#F4F7FB` | Page background |
| Reading surface | `#FFFFFF` | Question, code, feedback, summary |
| Main ink | `#14243A` | Body, headings, amber answer text |
| Action cobalt | `#2457C5` | Primary action, links, answer A |
| Answer rose | `#B43B55` | Answer B |
| Answer teal | `#08756B` | Answer C |
| Answer amber | `#F6C453` | Answer D |

Answer label contrast pairs remain fixed (6.47:1, 5.68:1, 5.57:1, 9.63:1). Do not reduce label opacity.

- **Lexend** for headings, question title, answer controls, actions.
- **Source Sans 3** for long prose, explanations, summary.
- **JetBrains Mono** for code and literal output only.

Signature: white question stage above a saturated 2×2 answer field (1 column on narrow phones). 12 px radius on stage and tiles. Progress is count plus slim cobalt bar, not a timer.

### Void → Chronicle transition

Entering a session **lifts** the user out of Void: optional 300 ms fade to white full viewport, then Chronicle layout. Leaving results returns to Void with the reverse. Do not embed the 3D canvas behind live questions.

## Ledger (admin)

- Same light neutrals as Chronicle canvas, without answer colors.
- Tables and forms use 8 px radius inputs, 12 px cards only when grouping unrelated fields.
- Primary button cobalt; destructive actions rose `#B43B55`.
- Publish control disabled until key, explanation, and citation exist (mirrors DB trigger).

## Screen flows

### Sign in

Email or magic link (product decision). Minimal centered form on Void background with Chronicle-white card for the form only.

### Void: multiverse

Four year portals in a loose arc (not a symmetric three-card row). 3rd Year portal is lit; others muted with empty state copy.

### Void: universe (3rd Year)

Planet for IT0123 with title and code beneath the sphere. Other years would list additional planets when seeded.

### Void: planet dock

Orbit rail with five moons. SA2 and Midterm Exam launch bank setup; empty moons locked.

### Bank setup (Chronicle shell)

Mode **Prep** vs **Exam**, module filters, session length, question count, forward-only reminder, Start. Same rules as legacy lobby.

### Question, Prep, Exam, summary

Unchanged from DevNet Reviewer sequence in the prior design doc: forward-only, exact scoring, Exam privacy, streak and audio rules in Prep, gear settings persisted locally.

## Icons and motion libraries

- Icons: **@phosphor-icons/react**, stroke weight 1.5, one family project-wide.
- UI motion: **motion/react** in client leaves only.
- Three.js isolated in `components/space/*`; never mix GSAP and Motion in one component.

## Accessibility

- Route mirror lists duplicate every spatial destination with real links.
- Focus rings 3 px, offset 2 px, cobalt on Void, navy on Chronicle.
- Live regions for Prep feedback and selection counts.
- `prefers-reduced-motion` and `prefers-reduced-transparency` both respected on Void glass (solid fallback if blur used sparingly).

## Reference assets

- Concept exploration: [design/revwi/](design/revwi/) (orbit direction; refined by this document).
- HTML handoff for Figma: [design/revwi/html/](design/revwi/html/) when Figma MCP is available.
- Legacy quiz still: [design/quiz-screen-concept.png](design/quiz-screen-concept.png).

## Anti-patterns (explicit)

- Do not put kickers or section-number eyebrows on quiz or admin screens (Impeccable craft floor).
- Do not use em dashes in UI copy.
- Do not show correctness during Exam in color, motion, music layers, or network payloads.
- Do not truncate answer text to fit tiles.

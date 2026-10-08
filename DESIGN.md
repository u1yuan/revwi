# Revwi design direction

<!-- impeccable:design-schema 1 -->

Revwi has three deliberately different surfaces. The Grove makes student navigation feel like a small side-view study world. Chronicle is an opaque, high-contrast reading surface. Ledger is a quiet admin workspace. The selected visual references are in [design/revwi-grove/](design/revwi-grove/).

| Surface | Theme | Job |
| --- | --- | --- |
| **Grove** | Cool dusk blue, slate, foliage, restrained teal and amber lights | Year, course, and assessment navigation |
| **Chronicle** | Light `#F4F7FB` canvas and white question stage | Prep/Exam study, results, history |
| **Ledger** | Light neutral tables and forms | Course and bank management |

The Grove uses `@react-three/fiber` with an orthographic camera. One canvas stays mounted across year, course, and assessment route changes. Chronicle and Ledger use standard HTML; questions never render over WebGL. Interactive labels, controls, and route links are HTML, separate from the decorative `aria-hidden` canvas.

## Grove

The scene is a layered 2.5D side view: cool dusk sky, distant hills and tree silhouettes, midground path, and foreground stone terraces. Navigation advances from year → course → assessment. It has no planets, stars, portals, orbit controls, purple glow, glass HUD, timer, or leaderboard. A compact top bar holds the Revwi wordmark, current year, sign-in, and **List view**.

Four year destinations stay available as real links. Empty years open to an explicit “No courses in this year yet” state. The 3rd Year course is **IT0123 DEVELOPMENT NETWORK**. Its five assessment landmarks appear in this order: SA1, SA2, Midterm Exam, SA3, Final Exam. SA2 and Midterm Exam are lit and open. Empty banks are muted, locked, and labeled “Bank empty.”

The HTML destination cards and List view duplicate every available scene route for touch, keyboard, and screen-reader use. At narrow widths, the scenery becomes a shallow visual band and the HTML cards form a readable grid below it. No destination depends on hitting a WebGL object.

- Action cobalt: `#2457C5`; active teal: `#08756B`; warm landmark light: `#F6C453`.
- Navigation labels use Geist. Pixel-like texture belongs only to terrain, landmark borders, and tiny decorative details.
- Reduced motion removes entry movement and hover lift. The scene has no idle spin or camera flight. Avoid blur-heavy, translucent UI.

## Chronicle

Chronicle inherits the verified DevNet Reviewer interaction and contrast rules. Do not darken it to match the Grove.

| Role | Token | Use |
| --- | --- | --- |
| Study canvas | `#F4F7FB` | Page background |
| Reading surface | `#FFFFFF` | Question, code, feedback, summary |
| Main ink | `#14243A` | Body, headings, amber answer text |
| Action cobalt / answer A | `#2457C5` | Primary action, links, answer A |
| Answer B | `#B43B55` | Rose tile |
| Answer C | `#08756B` | Teal tile |
| Answer D | `#F6C453` | Amber tile with navy text |

Answer label contrast pairs remain fixed (6.47:1, 5.68:1, 5.57:1, 9.63:1). Do not reduce label opacity. Lexend is for headings, questions, answer controls, and actions; Source Sans 3 is for long prose and explanations; JetBrains Mono is for code and literal output.

A white question stage sits above a saturated 2×2 answer deck on desktop. Phones use one answer column. Answer text never truncates. Progress is a count and slim cobalt bar, never a timer. Bank setup offers Prep and Exam, module filters, session length, the available count, and a forward-only reminder.

### Seedling dock

One stage-one seedling sits in a reserved dock outside the reading column on desktop or on a separate shelf outside answer and action hit areas on mobile. It has a small rounded green body, two asymmetrical leaves, pebble feet, and a restrained cobalt wrap. Prep may show curious, celebratory, or supportive poses. During an unfinished Exam it is neutral: no correctness-linked pose, glow, color, sound, timing, or growth. Reduced motion uses static poses only. Later growth stages are deferred.

### Transitions and privacy

Moving from the Grove into Chronicle may use a short opacity fade. The Grove canvas does not remain behind a live question. Prep gives immediate feedback; unfinished Exam gives only a saved acknowledgement. Exam correctness, keys, explanations, streaks, and correctness-specific sound or motion remain hidden until finish. Reduced motion removes answer-tile shake and other nonessential motion.

## Ledger

Ledger uses light neutrals without answer colors. Tables and forms use 8 px input radii and 12 px cards only to group related fields. Primary actions use cobalt; destructive actions use rose. Publish controls remain disabled until a key, explanation, and citation exist, matching the database trigger.

## Accessibility and implementation

- Focus rings are 3 px with a 2 px offset: warm amber on Grove, navy on Chronicle.
- Every spatial destination has a real HTML link. The canvas is decorative and `aria-hidden`.
- Question, answers, progress, settings, companion, and primary action remain readable at 390 px without horizontal page scroll.
- UI icons use `@phosphor-icons/react`. Client UI motion uses `motion/react`; do not add GSAP beside Motion in one component.
- UI copy uses no em dashes. Long question and answer text remains fully visible.

The [Grove concept pack](design/revwi-grove/README.md) contains the selected navigation, study, mobile, and companion references. Its PNGs guide layout and material treatment; controls and text are rebuilt as UI, not displayed as raster mockups.

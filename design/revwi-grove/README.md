# Revwi 2.5D Grove concept pack

This pack explores a cohesive student experience for Revwi as an original 2.5D side-view study world. It replaces the space metaphor in the concept direction only. Ledger admin, production code, schema, APIs, dependencies, scoring, and question-bank behavior are unchanged.

The four images were generated with the built-in image-generation workflow, one call per asset. They are visual references for later HTML, CSS, and scene implementation, not specifications for baking text or controls into production raster art.

## Selected deliverables

| File | Selected concept | Output details |
| --- | --- | --- |
| [01-world-navigation.png](01-world-navigation.png) | 3rd Year grove with DEVELOPMENT NETWORK and five assessment landmarks | 1672 x 941 RGB |
| [02-review-session-desktop.png](02-review-session-desktop.png) | Desktop Prep session with a 2 by 2 answer deck and reserved companion dock | 1672 x 941 RGB |
| [03-review-session-mobile.png](03-review-session-mobile.png) | Mobile-first Prep session with a single-column deck and separate companion shelf | 941 x 1672 RGB |
| [04-companion-evolution.png](04-companion-evolution.png) | Four growth stages and five behavior poses | 1774 x 887 RGBA, transparent corners |

## Shared design system

### Palette

| Role | Color |
| --- | --- |
| Action cobalt and answer A | `#2457C5` |
| Answer C and active-world teal | `#08756B` |
| Answer B rose | `#B43B55` |
| Answer D and warm landmark light | `#F6C453` |
| Study canvas | `#F4F7FB` |
| Main ink | `#14243A` |
| Reading surfaces | White to warm off-white |
| World materials | Cool dusk blue, slate stone, natural foliage green |

Purple neon, glass-heavy panels, and space imagery are outside this direction.

### Type treatment

- Use crisp sans-serif typography for questions, answers, navigation, settings, progress, and actions.
- Preserve the established Chronicle roles: Lexend for questions and controls, Source Sans 3 for long explanations, and JetBrains Mono for code or literal output.
- Limit pixel styling to landscape textures, panel borders, landmarks, and small decorative labels.
- Never truncate question or answer text to fit a tile.

### Dimensional model

- Frame the world as an orthographic side-view diorama with foreground terrain, a traversable midground path, and shallow parallax scenery.
- Route changes may shift or crossfade layers, but should not introduce orbit controls or perspective-heavy navigation.
- Assessment locations are landmarks along one readable path. Active banks use restrained destination light. Empty banks use locks, closed gates, sleeping lanterns, and muted materials so they look unavailable rather than broken.
- Study content remains opaque, high contrast, and HTML-like. The grove provides atmosphere around the study surface and never competes with reading.
- Design dials for this exploration are `DESIGN_VARIANCE 8`, `MOTION_INTENSITY 6`, and `VISUAL_DENSITY 5`.

### Companion placement and behavior

- Use one persistent seedling companion across navigation and study milestones, not a roster of pets.
- Reserve a dock or shelf before placing the companion. It must never overlap questions, answers, progress, feedback, settings, or the primary action.
- Desktop uses a bounded lower-left dock outside the centered reading column.
- Mobile uses a dedicated lower-left shelf outside all answer and action hit areas. Do not float the companion above sticky controls.
- Prep idle uses curious observation. Prep correct may use a short celebration. Prep incorrect uses a warm supportive pose without punishment.
- Results may celebrate and reveal cosmetic growth.
- Reduced motion uses static pose swaps only, with no idle sway, hopping, or particle effects.

### Exam privacy

During an unfinished Exam attempt, the companion must stay neutral. It cannot reveal correctness through expression, pose, glow, particles, color changes, timing, sound, or growth. The rest of the client follows the same rule: no correctness, answer keys, explanations, streaks, or correctness-specific sound or motion until the attempt is finished.

## Validation notes

- Navigation shows SA2 and Midterm Exam as illuminated destinations and SA1, SA3, and Final Exam as intentionally locked `Bank empty` locations.
- Desktop uses one off-white reading surface, a readable 2 by 2 answer deck, and an isolated companion dock.
- Mobile is composed as a portrait screen rather than a cropped desktop layout. It uses one answer column, keeps the action visible, and avoids horizontal overflow.
- Companion art is an original plant creature with a consistent silhouette, restrained cobalt detail, transparent background, four growth stages with distinct facial personalities, and distinct idle, curious, celebratory, supportive, and neutral Exam poses.
- No concept uses a timer, leaderboard, purple neon, space imagery, glass-heavy HUD, or correctness cue during Exam.

## Final prompts

### 01-world-navigation.png

```text
Use case: ui-mockup
Asset type: Revwi student product concept, desktop 16:9 world-navigation screen
Primary request: Design a polished, shippable-feeling 2.5D side-view study world for a course review web app. Show the 3rd Year biome as a layered grove landscape. DEVELOPMENT NETWORK is the central course landmark. A clear traversable path connects five assessment locations in this exact left-to-right order: SA1, SA2, Midterm Exam, SA3, Final Exam. SA2 and Midterm Exam are active illuminated destinations. SA1, SA3, and Final Exam are dormant and visibly locked, unavailable but intentional rather than broken.
Scene/backdrop: cool dusk sky, distant layered hills and trees, midground ruins and foliage, foreground slate stone and grass platforms; orthographic diorama composition with subtle depth and route-driven parallax cues, not perspective-heavy.
Style/medium: original high-fidelity game-like web UI concept; crisp vector/3D hybrid forms with tactile pixel-textured materials limited to terrain, borders, landmarks, and tiny decorative labels. Not pixel-art characters. No direct imitation of any existing game.
Composition/framing: wide 16:9 viewport. Landscape path is the hero. Central DEVELOPMENT NETWORK landmark is readable and visually dominant without obscuring the five assessment stops. Minimal top navigation chrome with Revwi wordmark, small 3rd Year context, settings icon, and a clear “List view” affordance as real UI. Preserve clean negative space and obvious route hierarchy.
Lighting/mood: cool hopeful dusk, gentle teal and amber destination lights, quiet study-adventure mood, readable contrast.
Color palette: Revwi cobalt #2457C5, teal #08756B, rose #B43B55, amber #F6C453; cool blue-gray dusk, slate stone, natural green foliage, small off-white labels. Absolutely no purple neon.
Text (verbatim): “Revwi”; “3rd Year”; “DEVELOPMENT NETWORK”; “SA1”; “SA2”; “Midterm Exam”; “SA3”; “Final Exam”; “List view”; lock plaques may say “Bank empty”.
Constraints: assessment states must be unmistakable; active destinations emit restrained cobalt/teal or amber light; locked destinations use closed gates, sleeping lanterns, lock icons, and muted materials; all core labels legible and correctly spelled; minimal chrome; accessible-looking HTML controls; no pet on this screen.
Avoid: space imagery, planets, stars, portals, purple effects, glass HUD panels, timers, leaderboards, dense copy, fantasy inventory HUD, malformed text, excessive icons, excessive decoration, direct Terraria imitation, watermark.
```

### 02-review-session-desktop.png

```text
Use case: ui-mockup
Asset type: Revwi desktop 16:9 Prep-mode review-session product mockup
Primary request: Create a polished, shippable-feeling desktop study screen inside the same original 2.5D side-view grove world. A large off-white HTML-style question surface sits above a spacious 2 by 2 answer deck. The study UI is crisp and flat enough for real web implementation, while layered stone terraces, foliage, distant hills, and a cool dusk sky remain visible around the edges. A small original seedling companion occupies its own clearly bounded lower-left dock and never overlaps the question, answers, progress, or primary action.
Scene/backdrop: shallow orthographic grove diorama matching an educational adventure path; distant parallax hills and tree silhouettes, slate ledges, subtle greenery. Keep atmosphere visible but subdued behind an opaque high-contrast content area.
Style/medium: high-fidelity web app UI mockup, HTML-like controls and typography; tactile pixel-textured materials only on scenery, panel borders, and tiny decorative accents. Crisp sans-serif text. No glass panels.
Composition/framing: 16:9. Compact top header with Revwi, “Prep”, progress, and settings. Centered reading column. Large off-white question card. Below it, four equally prominent answer buttons in a two-column by two-row deck, with generous padding and full text. Bottom-right primary action “Next”. Lower-left companion dock is a separate shelf outside all content hit areas, approximately 18 percent of width, containing the seedling at small scale.
Subject: Question content is a networking study item. Seedling companion is original: a tiny rounded sprout creature made of soft green plant forms, two asymmetrical leaves, pebble-like feet, simple friendly face, and one restrained cobalt wrap detail. It is in a curious observation pose, not celebrating or judging.
Lighting/mood: calm focused study at cool dusk, warm local lantern accents; content remains high contrast and easy to scan.
Color palette: canvas #F4F7FB, reading surface warm off-white/white, main ink #14243A, action cobalt #2457C5, answer A cobalt #2457C5, answer B rose #B43B55, answer C teal #08756B, answer D amber #F6C453 with dark navy text; cool slate, natural greens, no purple.
Text (verbatim): “Revwi”; “Prep”; “Question 7 of 20”; “Which HTTP method is commonly used to retrieve a resource?”; “A”; “GET”; “B”; “POST”; “C”; “PUT”; “D”; “DELETE”; “Next”; “Companion”.
Constraints: exactly one large question surface and exactly four answer choices in a 2 by 2 arrangement; no answer is selected and no correctness feedback is shown; include one slim cobalt progress bar; only one primary action; all answer text fully visible; companion dock cannot touch or cover controls; clear accessible focus-ready control shapes; this is a raster concept reference for later HTML implementation.
Avoid: dark quiz surface, space imagery, purple effects, glass HUD, generic fantasy HUD, timer, leaderboard, streak feedback on this neutral state, text truncation, tiny answer labels, decorative clutter, direct Terraria imitation, copying any existing virtual pet, watermark.
```

### 03-review-session-mobile.png

```text
Use case: ui-mockup
Asset type: Revwi portrait mobile Prep-mode review-session concept for a 390 px viewport
Input image: use the provided desktop Revwi grove study screen only as a reference for palette, visual identity, HTML-style surfaces, answer colors, and the same original seedling companion. Recompose for mobile from scratch; do not merely crop or shrink the desktop layout.
Primary request: Create a polished portrait mobile study screen designed specifically around 390 px width. Use a single-column answer deck, readable text, a visible primary action, and no horizontal scrolling. Preserve meaningful 2.5D grove atmosphere as a shallow background layer behind and between opaque content regions. Place the same seedling companion on a dedicated lower-left shelf outside every answer and action hit area.
Scene/backdrop: compact cool-dusk grove strip with layered tree silhouettes, slate ledge, and foliage. Atmospheric scenery is shallow and quiet, never behind text at low contrast.
Style/medium: high-fidelity mobile web app mockup with crisp HTML-like controls, off-white reading surfaces, sans-serif typography; pixel texture limited to landscape materials, small border accents, and the companion shelf.
Composition/framing: portrait approximately 9:16, representing a 390 px viewport. Slim top bar with Revwi, Prep, compact progress, and settings. Question card below. Four full-width answer buttons stacked vertically with generous touch height. A compact companion shelf sits in a separate lower-left atmospheric band and does not intersect answer cards or the bottom action region. Bottom primary action “Next” is fully visible and comfortably tappable. No content extends past the horizontal edges.
Subject: same original small seedling companion from the reference: round soft-green plant body, two asymmetrical leaves, pebble-like feet, simple friendly face, restrained cobalt wrap detail; curious neutral observation pose with no correctness cue.
Lighting/mood: calm focused study, cool dusk, restrained warm lantern highlight, high text contrast.
Color palette: study canvas #F4F7FB, off-white cards, ink #14243A, cobalt #2457C5, rose #B43B55, teal #08756B, amber #F6C453 with navy text; natural greens and slate; no purple.
Text (verbatim): “Revwi”; “Prep”; “7 of 20”; “Which HTTP method is commonly used to retrieve a resource?”; “A  GET”; “B  POST”; “C  PUT”; “D  DELETE”; “Next”; “Companion”.
Constraints: one-column answer deck with exactly four answers; all text fully visible; question, answers, progress, settings, companion shelf, and Next action all understandable at 390 px; no selected answer or correctness feedback; only one primary action; seedling never overlaps or crowds any control; preserve accessible touch targets and clear hierarchy.
Avoid: desktop layout squeezed into portrait, two-column answer grid, horizontal scroll, truncated answer text, tiny controls, dark quiz surface, glass HUD, generic fantasy HUD, timer, leaderboard, streak/correctness cues, purple neon, direct Terraria imitation, copying an existing pet, watermark.
```

### 04-companion-evolution.png

```text
Use case: stylized-concept
Asset type: transparent-background character design sheet for Revwi’s persistent study companion
Input image: use the provided Revwi mobile study screen only as a visual reference for the existing original seedling companion’s core identity: round soft-green plant body, two asymmetrical leaves, pebble-like feet, simple friendly face, restrained cobalt wrap detail. Preserve that identity while developing it into a production-minded concept sheet.
Primary request: Create one clean transparent-background concept sheet showing four cosmetic growth stages of the same original seedling creature and five clearly distinct behavior poses: idle, curious, celebratory, supportive, and neutral Exam. The creature grows through study milestones but remains recognizable at every stage. It should have a strong silhouette at small UI size, gentle appeal, readable eyes and leaf gestures, soft green plant forms, and restrained cobalt details.
Style/medium: polished 2.5D game character concept art, soft modeled forms with selective crisp pixel-textured edge accents; clean turntable/sprite-sheet presentation, not sketchy. Original character design with no resemblance to a named existing virtual pet.
Composition/framing: wide character sheet on true transparent alpha. Top row: exactly four evenly spaced full-body growth stages, left to right. Stage 1 is a tiny round sprout with two leaves and pebble feet. Stage 2 gains a small unfurling side leaf and slightly taller body. Stage 3 gains a subtle bud crest and a little leaf cape shape. Stage 4 becomes a graceful compact grove guardian with a small flower crown and richer leaf layers, still cute and small. Bottom row: exactly five evenly spaced full-body pose studies of the mid-stage design: idle, curious, celebratory, supportive, neutral Exam. Leave generous transparent separation around every figure.
Behavior direction: idle is a relaxed gentle sway pose; curious leans forward with one leaf perked; celebratory lifts both leaves and makes a small joyful hop; supportive sits or leans close with sympathetic warm expression, never sadistic or punishing; neutral Exam stands calm and attentive with symmetrical relaxed leaves, closed mouth, and no colored glow, confetti, checkmark, X, score, or correctness cue.
Color palette: soft sage and leaf greens, warm cream face accents, deep natural green shadows, restrained Revwi cobalt #2457C5 only as a small wrap or seed-band detail; tiny warm amber bud highlights only on later cosmetic stages. No purple.
Text (verbatim): small understated labels beneath figures: “Stage 1”; “Stage 2”; “Stage 3”; “Stage 4”; “Idle”; “Curious”; “Celebrate”; “Support”; “Exam neutral”.
Constraints: actual transparent background with alpha; exactly four evolution figures and exactly five pose figures; one consistent creature identity; each pose legible at small size; Exam neutral communicates no correctness; supportive pose feels encouraging without punishment; no scene, floor, panel, vignette, shadow box, UI controls, props, badges, or background.
Avoid: white or checkerboard baked background, copying Seedy or any existing pet’s silhouette, face, palette, accessories, or identifying details; generic Pokémon-like monster; acorn mascot; cactus mascot; humanoid body; purple neon; weapons; text other than the small labels; watermark.
```

The selected image received this targeted facial-variation edit after the initial generation:

```text
Use case: precise-object-edit
Asset type: transparent-background Revwi companion evolution concept sheet
Primary request: Edit only the facial expressions of the four growth-stage characters in the TOP ROW so each stage has a distinct personality and developmental feeling.
Exact top-row face changes:
- Stage 1: tentative and newly-awake, wide curious eyes, slightly raised inner brows, tiny closed “o” mouth. Sweet and cautious, not frightened.
- Stage 2: playful and adventurous, one eye winking, the other bright and open, small asymmetric grin.
- Stage 3: quietly confident and studious, focused open eyes with slightly lowered brows, small closed proud smile. Determined but friendly.
- Stage 4: calm nurturing grove guardian, softly closed crescent eyes and a serene closed smile. Mature and reassuring, not sleepy.
Invariants: preserve the four top-row body silhouettes, leaf growth, colors, cobalt wraps, sizes, positions, and labels exactly. Preserve the entire bottom row of five behavior poses exactly, including their faces, bodies, labels, order, and spacing. Preserve the transparent alpha background, canvas size, two-row layout, and all existing text. Do not add objects, effects, panels, shadows, scenery, or new labels.
Constraints: facial variations must remain legible at small UI size and clearly differ from one another; no correctness symbols or Exam feedback cues; no resemblance to an existing named virtual pet.
Avoid: changing anatomy, growth stages, bottom-row poses, palette, accessories, typography, spacing, transparency, or composition.
```

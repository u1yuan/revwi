# DevNet Reviewer

A complete local reviewer for the supplied DevNet midterm and Module 3–4 summative exports.

## Run it

1. Install [Node.js](https://nodejs.org/) and run `npm install` in this folder.
2. Run `npm run dev`.
3. Open the Local URL printed by Vite. A phone on the same network can use the Network URL.

Questions, scoring, local references, the exhibit, and feedback sounds are bundled with the app. Internet access is only needed for optional web fonts and external citation links.

## Included

- 122 verified playable questions across Modules 1–4, curated from all 149 exported source positions.
- A separate curation inventory covering 122 included items, 23 duplicates, and 4 exclusions with reasons.
- Single choice, exact-count multiple choice, matching, formatted code, and a locally bundled exhibit.
- Prep and Exam flows, forward-only progress, accessible skip/replacement dialogs, exact scoring, and read-only review.
- 10, 25, 50, and all-available lengths when the selected modules contain enough questions.
- Unseen-first and least-recent selection with a fixed order after reload.
- Versioned local persistence, v1 session migration, immutable attempt history, and separate missed-question retries.
- Prep-only flame streaks, milestone popups at 3, 5, 10, and every five thereafter, plus comeback and miss toasts. Exam gives no correctness clue before results.
- Runtime Web Audio interaction cues plus four original local WAV cues. A settings gear remembers master, music, and sound-effect levels.
- Background music starts from Start or Resume. Prep layers build with the streak; Exam stays on the base loop.
- Keyboard and touch controls, 390 px layouts, zoomable exhibits, visible focus, and reduced-motion behavior.

## Content provenance

Every playable item in [src/questions.ts](src/questions.ts) has a stable ID, source position, module/topic, exact key, explanation, citation, and any required edit or exhibit metadata. [src/curation.ts](src/curation.ts) accounts for every Midterm question 1–99 and Summative question 1–50. The required exhibit is local at [public/exhibits/midterm-97.jpg](public/exhibits/midterm-97.jpg).

## Verify

- `npm run validate:bank` validates all 149 curation positions, IDs, keys, citations, modules, duplicate targets, and local exhibits.
- `npm run build` runs bank validation, TypeScript, and the Vite production build.
- With the dev server running and Python Playwright installed, `py -3.9 scripts/verify_mvp.py` verifies migration, session lengths, recency, reload order, dialogs, history, retry immutability, streak milestones, Exam privacy, audio, reduced motion, and 390 px overflow.

The local WAV assets are reproducible with `node scripts/generate-sfx.mjs`.

## Music

The study bed is **Lofi Hip Hop Loop** by omfgdude (credit name OMF-Games), released CC0 on [OpenGameArt](https://opengameart.org/content/lofi-hip-hop-loop). The download is already one seamless loop (about 128 seconds), so it is kept whole rather than cut into a shorter cell that did not match its own start. `public/music/base-loop.ogg` is that file. `public/music/base-loop.mp3` is a 64 kbps mono fallback. Streak layers are synthesized in the browser at 60 BPM in F minor, which matches the loop's phrase spacing and low end.

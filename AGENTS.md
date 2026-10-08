# Revwi

Course review webapp. Students move year → course → assessment in a Three.js scene (Void), then study one question at a time on a light reading surface (Chronicle). Admins maintain banks (Ledger). Launch content is **IT0123 DEVELOPMENT NETWORK** in **3rd Year**: SA2 and Midterm Exam are playable; SA1, SA3, and Final Exam stay locked until they have published questions.

## Which document wins

| Question | Read |
| --- | --- |
| What the product must do | [PRODUCT.md](PRODUCT.md), then [PRD.md](PRD.md) for quiz behavior |
| Schema, routes, grading, RLS | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Visual surfaces and tokens | [DESIGN.md](DESIGN.md) and [design/surfaces/](design/surfaces/) |
| How to run it | [README.md](README.md) |

`PRD.md` describes the original local reviewer. Where it conflicts with `PRODUCT.md` or `ARCHITECTURE.md` (accounts, storage, navigation), follow the later docs. Quiz rules in the PRD still apply: forward-only sessions, exact scoring, Prep feedback, Exam privacy, streaks, and local audio preferences.

## Current layout

The running app is Next.js App Router. `src/` is the earlier Vite reviewer. Keep it as the source of question data and the Chronicle interaction model. New pages, actions, and scenes go in `app/`, `components/`, and `lib/`.

```text
app/                  routes, server actions
  (space)/            multiverse, universe, planet, bank setup
  (play)/             question session
  (auth)/ admin/      sign-in and admin
  actions/            writes (attempts, later admin)
components/space/     R3F only
components/quiz/      Chronicle session UI
lib/domain/           scoring and session rules (no React, no Supabase)
lib/server/grading.ts service-role client, server-only
lib/catalog/static.ts fallback catalog when Supabase is unset
lib/supabase/         browser, server, env
supabase/migrations/  schema, RLS, triggers
src/questions.ts      playable bank
src/curation.ts       inventory the seed and validator must match
mods/                 LMS exports and module notes; not the playable bank
```

`@/*` maps to the repo root.

Without Supabase keys, Void navigation and the local reviewer still run. Attempts and grading on the server require `.env` (see `.env.example`).

## Commands

```bash
npm install
npm run dev          # Next.js on 0.0.0.0
npm run validate:bank
npm run build        # validates the bank, then next build
npm run seed         # needs SUPABASE_SERVICE_ROLE_KEY in .env
npm run lint
```

After schema changes: `supabase db push`, then `npm run seed` when the bank should match `src/curation.ts`.

## Invariants

- **Exam privacy.** Until an attempt is finished, Exam mode returns only a saved acknowledgement. Correctness, keys, explanations, streaks, and correctness-specific sound or motion stay off the client and out of that response.
- **One scorer.** `score()` in `lib/domain/quiz-core.ts` is the scoring implementation. Server actions call it. Do not reimplement scoring in SQL or in the browser.
- **Keys stay server-side.** `question_keys` is denied to students by RLS. The service-role client exists only in `lib/server/grading.ts` (`import 'server-only'`). No other module creates one.
- **RLS is the access boundary.** Middleware redirects are convenience. Students cannot write attempts or read keys by calling Supabase from the client.
- **Publish gate.** A question reaches students only as `published`, and only with a key, an explanation, and at least one citation. The database trigger enforces this.
- **Verified bank.** Playable items come from the curated exports, not from module notes and not from generated questions. Preserve wording unless a change is labeled edited. `npm run validate:bank` must pass before a bank change is done. `npm run build` runs that check.
- **Empty banks are locked.** SA1, SA3, and Final Exam show as locked moons, not as errors.
- **One unfinished attempt** per student per assessment. Order and locked answers survive reload.
- **Audio preferences** stay in `localStorage`. Attempts and recency belong in Postgres when Supabase is configured.
- **No timer, leaderboard, or live multiplayer.**

## UI

Three surfaces. Do not restyle one to match another.

| Surface | Where | Look |
| --- | --- | --- |
| Void | `/`, `/u/[year]`, `/c/[course]`, bank setup | Dark space, cobalt `#2457C5`, WebGL |
| Chronicle | play and results | Light `#F4F7FB`, Kahoot-style answer deck |
| Ledger | `/admin` | Light tables and forms, no answer colors |

- WebGL stays in `components/space/`. The quiz renders no 3D. The `(space)` layout keeps one canvas mounted across route changes.
- Every spatial destination also exists as a real HTML link (route mirror). The canvas is `aria-hidden`.
- Honor `prefers-reduced-motion`: cut camera flights, stop idle spin, and drop answer-tile shake.
- Chronicle tokens, contrast pairs, and type roles are in `DESIGN.md`. Answer text is never truncated to fit a tile. UI copy does not use em dashes.
- Icons: `@phosphor-icons/react`. UI motion: `motion/react` in client components. Do not add GSAP beside Motion in the same component.
- Question, answers, and the primary action stay readable at 390 px without horizontal page scroll.

When a change affects a rendered page, exercise it in the browser at desktop and at 390 px, including reduced motion when motion or the canvas changed.

## Supabase

Load `.agents/skills/supabase/SKILL.md` before schema, RLS, Auth, or client changes. Load `.agents/skills/supabase-postgres-best-practices/SKILL.md` before writing or reviewing SQL.

Server actions parse input with Zod before they touch the database. Generate `lib/supabase/types.ts` from the schema when columns change so `tsc` catches renames.

Never commit `.env` or `.env.local`. Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable or in client code.

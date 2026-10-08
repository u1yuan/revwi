# Revwi

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Students** review course assessments on a laptop or phone. They sign in, pick a year level, pick a course, and run Prep or Exam sessions.
- **Admins** add courses, manage question banks per assessment (SA1, SA2, SA3, Midterm Exam, Final Exam), and publish verified items.

## Product purpose

Revwi is a review webapp with role-based access. Students navigate a course multiverse (year level → course → assessment bank) and study one question at a time with no backtracking. Admins maintain banks on the server. Prep mode teaches with immediate feedback; Exam mode hides correctness until the attempt ends.

## Operating context

Launch ships one populated planet: **IT0123 DEVELOPMENT NETWORK** (Networking and Communications 2) in the **3rd Year** universe. Other year levels exist but show no courses yet. Questions can include long technical prose, code, matching pairs, and local exhibits. Answer keys and explanations are verified before publish; the app never invents scores.

## Capabilities and constraints

- Supabase Auth with profiles (`admin` | `student`). Students cannot read answer keys; grading runs on the server.
- Three.js renders navigation only (multiverse, universe, planet). The quiz is a flat, high-contrast reading surface (see [DESIGN.md](DESIGN.md)).
- Every spatial screen exposes the same destinations in a plain HTML list for keyboard, screen reader, and reduced-motion users.
- Forward-only sessions: no revisiting submitted questions. Exam mode must not leak correctness in UI, audio, or API responses until finish.
- Device-local preferences for master volume, music, and sound effects. Attempts and recency live in Postgres.
- No timer, leaderboard, or live multiplayer.

## Evidence on hand

- [ARCHITECTURE.md](ARCHITECTURE.md) defines schema, routes, and grading boundaries.
- [src/questions.ts](src/questions.ts) and [src/curation.ts](src/curation.ts) seed 122 playable items into SA2 and Midterm Exam banks.
- Legacy interaction and contrast rules originate in the prior DevNet Reviewer quiz implementation and remain authoritative for the **Chronicle** surface.

## Product principles

1. **Study first.** Code blocks, exhibits, and answer wording stay readable at 390 px width.
2. **Navigation delights; review clarifies.** Motion and 3D earn their place only outside the question screen.
3. **Trust the key.** Publish gates and server grading enforce verified content; empty banks show as locked, not broken.

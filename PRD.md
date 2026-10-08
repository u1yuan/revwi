# Gamified DevNet Midterm Reviewer — Product Requirements

## 1. Purpose and release scope

Build a personal, local web reviewer for the DevNet / Networking and Communications 2 midterm. The first release covers Modules 1–4 through the assessment questions in this repository. It runs in a desktop or phone browser, requires no account or backend, and keeps study progress on the device.

The experience presents **one question at a time with no backtracking**. It combines the focused solo-study feel of [Gizmo](https://gizmo.ai/) with a [Kahoot!](https://kahoot.com/)-style question layout: a prominent prompt, large answer tiles, clear progress, lively feedback, and sound cues. This is an individual study tool, not a live multiplayer game. There is no timer or speed-based scoring.

### Goals

- Practice the full midterm scope in short drills or longer mock sessions.
- Learn from verified answers, brief explanations, and source references.
- Review mistakes and track improvement across sessions without exposing answers during Exam Mode.
- Make each interaction clear and satisfying on desktop and phone, including with sound muted.

## 2. Question bank and content rules

**Every quiz question must originate from one of these two assessment exports:**

- [Midterm Exam bank](mods/CS0016NC2ATN37_S2-SUMMATIVE_Summative_Assessment_2-MIDTERM_Midterm_Exam.md) — 99 exported questions.
- [Summative Assessment 2 bank](mods/CS0016NC2ATN37_S2-SUMMATIVE_Summative_Assessment_2-S2-SUMMATIVE_Summative_Assessment_2_Module_3_and_M.md) — 50 exported questions.

Curate all usable, unique items from both exports. Assign each item to a Module 1–4 topic; deduplicate repeated questions across the banks. Preserve original question and choice wording where accurate. If wording, formatting, or an exhibit needs repair, label the item as edited and record the change. Do not launch an item with an unresolved ambiguity, missing exhibit, or unverified answer.

The exports show previous responses but do not consistently establish complete answer keys or explanations. Review each answer and write a brief explanation before the item enters the playable bank. Use [Module 3](mods/DEVASC_Module_3.md) and [Module 4](mods/DEVASC_Module_4.md) as supporting references; use official Cisco/DevNet material to verify Modules 1–2 answers. These references verify and explain source questions; they do not introduce new questions. Each playable item has a visible source citation in its explanation. Bundle any required exhibit image locally so the quiz does not depend on a remote image URL.

Keep the reviewed bank in project content files. Each item needs a stable ID, originating assessment and question number, module/topic tags, question type, original or labeled-edited prompt, choices or matching pairs, exact correct answer, brief explanation, citation, and any local exhibit asset. No in-app question editor or import screen is required in the first release.

Supported source formats are single choice, multiple choice (including “Choose two/three”), matching, and questions containing code or an exhibit. Code formatting and exhibit readability must survive curation.

## 3. Session setup and question flow

The start screen lets the learner select:

- **Mode:** Prep or Exam.
- **Topics:** any combination of Modules 1–4; all selected by default.
- **Length:** 10, 25, 50, or all available reviewed questions in the selected topics.

Show the available question count before starting. Disable a length that exceeds the available count and explain why. Pick distinct questions within a session. Shuffle them while favoring questions not seen recently; after unseen questions, draw from the least recently seen. Keep the chosen order fixed for that session, including after a reload.

Show the question number and session progress without a route back to prior questions. Single choice accepts one option. Multiple choice shows the required number of selections and accepts exactly that many. Matching requires every pair. An exhibit or code block stays visible with its question. If the response is blank or incomplete, pressing **Next** asks the learner to confirm a skip; a confirmed skip scores zero. Once an answer or skip is submitted, it is locked for that session. Browser navigation or resuming must never reopen an answered item for editing.

### Prep Mode

The first press of **Next** submits the response and reveals whether it is correct, the exact answer, a brief explanation, and its source citation. The button then becomes **Continue**; pressing it moves to the next question. A confirmed skip also reveals the answer and explanation before continuing. Progress and the current correct-answer streak are visible during the session.

### Exam Mode

Pressing **Next** submits and advances immediately. Show only neutral submission feedback and question progress; do not reveal correctness, explanations, streaks, or correctness-specific sounds until the session ends. A confirmed skip advances in the same way. The exam is untimed and finishes after the final item is submitted or skipped.

### Leaving and resuming

Save the active session after each meaningful change, including selections, submitted answers, feedback state, and the current question. On return, offer **Resume** or **Start over**. Keep one unfinished session at a time; starting a new one asks for confirmation before replacing it. A resumed session uses the same question order and locked answers.

## 4. Scoring, results, and motivation

Each question earns one point only for the complete correct answer; otherwise it earns zero. Multiple choice requires the exact set of choices, and matching requires all correct pairs. A skipped question earns zero. Show the total as points and percentage, plus correct/total by module. Do not award points for speed.

At the end of either mode, show the total score, module breakdown, best correct-answer streak, and a read-only review of **every** question with the learner's answer, correct answer, explanation, and citation. Mark wrong and skipped items clearly. **Retry missed questions** starts a new Prep session containing only the missed items; it does not change the completed attempt.

A streak counts consecutive fully correct questions within a session and resets on a wrong or skipped question. In Prep Mode, show a short, warm motivation line after correct-answer streaks of 3, 5, 10, and every 5 thereafter. Examples: “Three in a row. Keep going!” and “Five straight. You're finding your rhythm.” Keep these lines brief and out of the way of the explanation. In Exam Mode, calculate the streak privately and mention it only in the results. If an attempt ends without a streak milestone, do not invent one.

Save completed attempts, their question results, and question recency locally in the browser. The history screen lists past attempts with date, mode, selected modules, score, and best streak; opening an attempt shows its read-only review. Data remains on this device and survives a normal page reload or browser restart.

## 5. Interface, sound, and accessibility

Use a Kahoot!-like arrangement for the question screen: the prompt and optional exhibit above a grid of large, distinct answer tiles, with a compact progress header and a clear primary action. Use two columns where space allows and a single readable column on narrow phones. Matching controls may use a different layout as needed to keep both sides legible. Distinguish choices with text and shapes/icons as well as color. Preserve readable code blocks and zoomable exhibits.

Provide short, original sound cues for selection, submission/advance, skip confirmation, answer reveal, streak milestones, and completion. In Prep Mode, correct and incorrect reveals may have different cues. In Exam Mode, all in-session cues must be neutral so audio cannot reveal correctness. Do not start audio before a user interaction. Provide an obvious mute/volume control, remember its setting locally, and give the same state feedback visually when muted. Keep motion brief and respect reduced-motion preferences.

All controls must work by keyboard and touch, have visible focus states and readable labels, and remain usable without relying on color or audio alone. Keep the question, answer controls, and primary action readable at phone widths without horizontal page scrolling.

## 6. Acceptance criteria

- A learner can configure either mode, filter Modules 1–4, choose an available length, and complete a session with no backtracking or repeated item within that session.
- Single choice, exact-count multiple choice, matching, code, and exhibit items render and score correctly. Blank or incomplete responses require skip confirmation.
- Prep Mode reveals correctness, answer, explanation, and citation before advancing. Exam Mode reveals none of these, including through sounds or streaks, until results.
- Results calculate exact-answer scores and module breakdowns, review every item, and offer a new Prep session for missed items.
- Correct-answer streaks reset on wrong or skipped items; motivation lines appear at the specified Prep milestones and only in Exam results.
- Reloading or reopening restores an unfinished session without changing order or unlocking submitted answers. Completed attempts and audio settings remain available locally.
- Every playable question is unique, traceable to one of the two banks, tagged by module, verified, explained, cited, and supplied with any required local exhibit.
- The full flow remains readable and operable on desktop and phone, by keyboard and touch, with sound muted and reduced motion enabled.

The first release needs no accounts, cloud sync, live multiplayer, timer, in-app authoring, or questions generated from the reference lessons.

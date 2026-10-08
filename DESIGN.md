# DevNet Reviewer — design direction

## Intent and scope

Design a responsive solo web quiz for laptop and phone. The interface borrows Kahoot's fast rhythm of four colored answer areas, while the question, code, and exhibits receive the most space. This document specifies the flow and visual system; `design/quiz-screen-concept.png` is a desktop concept reference, not a playable screen. No application code is included in this deliverable.

**Content authority:** Use only the two assessment exports named in [PRODUCT.md](PRODUCT.md). Preserve question and answer wording during import, including explicit “Choose two” instructions. Do not infer a key from choice order or the export's past-attempt “Correct/Incorrect” labels. Verified per-question answer sets and brief explanations must be supplied before Prep correctness, Exam scoring, or answer review can be enabled. If validation is incomplete, show a clear “Answer key needed” state at mode selection and keep scored modes unavailable; never display invented feedback or a fabricated score.

## Visual system

| Role | Token | Use |
| --- | --- | --- |
| Study canvas | `#F4F7FB` | Quiet page background |
| Reading surface | `#FFFFFF` | Question, code frame, feedback, summary |
| Main ink | `#14243A` | Body, headings, amber answer text |
| Action cobalt | `#2457C5` | Primary action, links, first answer |
| Answer rose | `#B43B55` | Second answer |
| Answer teal | `#08756B` | Third answer |
| Answer amber | `#F6C453` | Fourth answer |

Answer labels are white on cobalt, rose, and teal, and navy on amber. The pairing is fixed even when answer order changes. These combinations measure **6.47:1, 5.68:1, 5.57:1, and 9.63:1** respectively; navy on the study canvas measures **14.55:1**. Do not reduce opacity on answer labels. Use a darkened or outlined focus treatment rather than a low-contrast pastel wash.

Use **Lexend** for page headings, question heading, answer controls, and actions; **Source Sans 3** for instructions, long question prose, explanations, and summary text; **JetBrains Mono** only for code, commands, and literal output. Favor 16–18 px reading text, a 28–36 px desktop question headline, 24–28 px on phone, and at least 16 px answer text. Keep code formatting, indentation, punctuation, and line breaks intact. Do not turn technical content into decoration.

The visual signature is a restrained white question stage above a high-energy answer field. Use 12–16 px corners, a fine neutral divider where needed, and little or no shadow. Progress is a text count plus a slim cobalt bar, not a countdown. Symbols on the four answers may echo Kahoot's scan rhythm, but each tile also carries its full text label and an accessible A–D name. Do not copy Kahoot branding.

## Screen sequence

### Mode selection

Show “DevNet Reviewer,” the bank scope, and two equally clear mode choices. **Prep** says “See feedback after each question”; **Exam** says “See results at the end.” State “Forward only—answers cannot be revisited” beside the Start action. Show the persistent sound control here and on every later screen. The Start action is disabled with an “Answer key needed” explanation until the content dependency is met. No player names, timer, leaderboard, or competitive ranking.

### Question, before submission

A narrow top rail contains product name, `Question n of N`, the progress bar, mode, and a persistent **Sound on / Sound off** button with icon and text. The main white stage contains the full question and, when present, a code block or exhibit panel. Under it, a two-by-two answer grid uses the four colors in reading order. A compact footer states “Choose one answer” or “Choose two answers” and holds **Next**. Next is disabled until the required number of choices is selected. Selection can be changed before Next; after Next it is locked. For multiple answer questions, show both the requested count and the current count, for example “Choose two · 1 of 2 selected.”

The desktop concept should show this real bank item verbatim, with no answer selected and no correctness indicator:

> Which Git command uploads commits to a remote?

Choices in source order: `git push`, `git init`, `git add`, `git commit`. The source is Module 3 and 4 summative question 8. Do not mark any choice as correct in the concept.

### Prep feedback

The first **Next** submits and reveals an explicit **Correct** or **Incorrect** heading, the selected answer, the verified answer, and a short explanation tied to the verified key. The answer tiles are locked. Add a word/icon label on the relevant tiles (“Your answer,” “Correct answer”); correctness is never conveyed only by green/red, shape, animation, or sound. The footer action changes to **Continue**. Continue advances to the next question without backtracking; on the last question it opens the summary.

### Exam progression

**Next** locks the current selection and immediately advances. Show only neutral progress feedback such as “Answer saved”; reveal no correctness, explanation, score, or per-question result during the attempt. The final Next opens the summary. The prior question cannot be revisited.

### Final summary

Give the total answered, verified correct count, percentage, and concise question-by-question result list after the final question. In Prep, this consolidates feedback already seen; in Exam, it is the first result reveal. Each row distinguishes correct, incorrect, and unanswered with text and icon as well as color. A post-session review can show the verified answer and explanation without reopening or editing the attempt. **Start another session** returns to mode selection. If verified keys are missing, do not render a scored summary; show the content dependency instead.

## Responsive layout

At 1280–1600 px, center a max-width 1120–1200 px composition. Keep the question stage prominent across the full content width, with prose capped near 70 characters per line. Allow the stage to grow for code or exhibits; the page scrolls naturally rather than clipping content to fit a game-like viewport. The answer grid sits below at two columns, equal gaps, and tile heights that can grow with wording. Do not truncate answers or reduce type to force equal lines. Keep Next visible after the grid, never overlaid on answers.

At 768–1279 px, retain two columns while reducing side gutters and question type. Below 768 px, use a single vertical answer column in source order; at 390 px use roughly 16 px side gutters, full-width tiles, at least 64 px tile height, and 44 px minimum touch targets. Keep the question, code, and exhibit ahead of all answers. Code scrolls horizontally inside its own framed region with visible overflow affordance; the entire page should not scroll sideways. An exhibit scales to width, can be opened larger, and has descriptive text. The progress rail wraps cleanly without hiding mode or sound. On short screens the primary action remains after the answers in normal flow, avoiding a footer that obscures content.

## Interaction and state rules

| State | Visible behavior |
| --- | --- |
| Unselected | Saturated answer tile, readable label, stable layout. |
| Hover / press | Small brightness or depth change; no layout jump. |
| Selected | Persistent 3 px inner navy/white contrast ring plus a checkmark and “Selected” for assistive technology; for multiple choice, each tile toggles independently until the required count. |
| Disabled | Next has a clearly disabled appearance and a nearby instruction telling how many selections are required. Locked answers after submission retain their labels and remain readable. |
| Keyboard focus | 3 px high-contrast outer ring with 2 px separation; tab order follows reading order. Enter/Space selects; arrow keys are optional only if proper radio/checkbox semantics are preserved. |
| Correct / incorrect | Use text, icon, and verified-answer wording in addition to color. Never reveal these states during Exam questions. |
| Loading | Preserve the question stage dimensions with a short “Loading question…” label; disable answer and Next actions. Avoid flashing placeholder tiles. |
| Missing exhibit | Reserve an exhibit panel labeled “Exhibit unavailable” with retry/open-source affordance. If the missing exhibit is required to answer, disable Next and explain why; do not silently score a guess. |
| Content unavailable | At mode selection, show which answer-key/explanation dependency is incomplete and keep scored starts disabled. |

Use semantic radio inputs for single answers and checkboxes for multiple answers, grouped beneath the actual question text. Announce selection count and Prep feedback through a polite live region; move focus to the feedback heading after submission and to the new question heading after advancing. On failed loading, keep the current question and selection intact and offer Retry.

## Sound and motion

Each meaningful interaction has a short distinct cue: mode choice, answer select, answer deselect, Next submit, Prep correct, Prep incorrect, Continue, final summary, and error/retry. A header **settings gear** holds master volume, a Music on/off control with its own volume, and a Sound effects on/off control with its own volume. The settings persist on this device. Turning sound effects off stops current and future cues immediately; turning them back on may play a subtle confirmation. Every cue has a simultaneous visible state change or text announcement.

Background music does not play on the home screen by itself. It starts when the learner presses Start or Resume, which is the user gesture browsers require. It fades out on Home, History, and Results unless the learner turns music on while already on one of those screens. The bed is a bundled CC0 lo-fi loop. In Prep, synthesized layers join as the streak grows: hats from 1, a bass pulse from 3, an arpeggio from 5, and a pad from 10. A miss returns to the bed. Cues briefly duck the music. Exam keeps the calm bed only, with no streak layers, so the music cannot reveal correctness.

Motion uses springs: button and card hover/press, answer-tile entrance and select, a drawn check, a glow on a correct reveal, and a shake of the answer symbol (not the answer sentence) on a wrong pick. The streak flame flickers by tier, pulses on a correct answer, and smokes out on a miss. Milestone messages spring in at 3, 5, 10, and every five after that. A correct answer right after a miss gets a small comeback toast, and a miss gets a short encouragement. Questions, screens, the progress bar, feedback, dialogs, and the exhibit zoom transition in and out. Results count up, module rows stagger, and a score of 80% or more gets a decorative burst that is not required to read the score. With **reduced motion**, transforms drop away and opacity fades remain. The flame stays static at its tier. Sound preferences are independent of motion. No timer, no leaderboard.

## Reference and handoff

Kahoot's [questions-on-device guidance](https://support.kahoot.com/hc/en-us/articles/115003197928-How-to-enable-See-questions-on-participant-s-screen-in-Kahoot-live-games) supports keeping both the prompt and answers on the learner's screen. Its [live settings guidance](https://support.kahoot.com/hc/en-us/articles/115016055107-Live-game-settings) explicitly offers an answer-contrast setting; this design makes high-contrast answer text the default. These are interaction references, not branding or feature requirements.

Before implementation, prepare a verified answer set and explanation for every imported question, validate which items are multiple answer, and recover any referenced exhibits. The image is visual direction only; the rules above govern actual states and responsive behavior.

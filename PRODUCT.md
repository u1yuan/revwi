# DevNet Reviewer

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One student preparing for the DevNet / Networking and Communications 2 midterm, studying on a laptop or phone.

## Product Purpose

A solo, one-question-at-a-time reviewer for the supplied assessment bank. Prep mode supports learning from immediate feedback; Exam mode supports a continuous attempt with results at the end.

## Operating Context

The bank is limited to the two exported assessment files in `mods/`: the midterm exam and the Module 3 and 4 summative assessment. Questions can contain long technical text, code, and referenced exhibits.

## Capabilities and Constraints

- A mode choice precedes a session. Questions advance forward only; there is no backtracking.
- In Prep, pressing **Next** reveals correctness and a brief explanation before **Continue** advances. In Exam, **Next** advances without correctness feedback; results and summary appear after the final question.
- Answers may be single or multiple choice. The interface takes inspiration from Kahoot's visible question and colored-answer rhythm, with sound for meaningful interactions.
- Background music can start with a session. Prep adds energy as a streak grows; Exam stays on the calm bed so sound never reveals correctness. A settings gear controls master, music, and effect levels.
- No timer or leaderboard is part of this solo study product.
- Verified answer keys and explanations are a content dependency. The exports record past attempt outcomes, not a trustworthy per-question key and explanation set. The product must not fabricate feedback or scores.

## Evidence on Hand

- `PRD.md` states the purpose, source bank, modes, forward-only flow, and Kahoot reference.
- `mods/CS0016NC2ATN37_S2-SUMMATIVE_Summative_Assessment_2-MIDTERM_Midterm_Exam.md` contains 99 exported questions.
- `mods/CS0016NC2ATN37_S2-SUMMATIVE_Summative_Assessment_2-S2-SUMMATIVE_Summative_Assessment_2_Module_3_and_M.md` contains 50 exported questions.

## Product Principles

1. Keep the current question and every answer readable on the student's own screen.
2. Make the forward-only mode rules clear before the session starts.
3. Give motivating response cues without obscuring technical content or inventing correctness.

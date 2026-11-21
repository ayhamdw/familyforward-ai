# Plan schema

The model returns one JSON object. The schema is strict (`.strict()` everywhere): unknown fields are rejected, so there is no field where a label, score, percentile, risk level or comparison could go. The source is `packages/shared/src/schemas.ts`, used by the API and the mobile app.

## Mapping to the brief

| Brief | Our field | Notes |
|---|---|---|
| `purpose` | `activity.why` | one sentence a parent can understand |
| `domain` | `activity.focus` | one of talking, reading, counting, feelings, movement, routines |
| (not in brief) | `activity.safety` | one short safety line, kept |
| easier / harder / notice | `activity.easier`, `activity.harder`, `activity.noticeThis` | one sentence each |

## Plan

| Field | Rule |
|---|---|
| `language` | `en`, `es` or `ar`; must match the survey |
| `summary` | two sentences for the parent |
| `days[]` | `{day, activity}`; one different activity per chosen day |
| `worthNoticing[]` | 0 to 3 of `{observation, tryThis, mentionTo: teacher\|pediatrician\|none, resourceIds[]}` |
| `resourceIds[]` | 2 to 4 ids that exist in `resources.json` |
| `checkIn[]` | 2 to 3 questions for next week, each answered `yes`, `somewhat` or `no` |
| `closing` | the fixed closing line for the language, exactly |

## Activity

`id`, `title`, `focus`, `minutes` (5, 10 or 20), `materials[]` (keys the family has), `steps[]` (3 to 6), `why`, `safety`, `easier`, `harder`, `noticeThis`.

## Stored by the API, not by the model

Per day: `done` (boolean) and `reaction` (`loved`, `fine`, `didnt_work` or null). Per plan: `checkInAnswers[]` (`yes`, `somewhat`, `no`). These are enums only, never free text.

## Not stored anywhere

The survey note. It is length-checked (140), used in memory to build the prompt (unless it mentions health or development), and dropped.

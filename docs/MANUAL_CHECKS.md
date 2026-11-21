# Checks only a person can do

Tick each one on a real Android phone unless it says otherwise. Note the phone model and Android version.

## Arabic and layout
- [ ] Set the language to Arabic. After the reload, every screen reads right to left, and back arrows, chevrons and progress bars point the right way.
- [ ] The bottom tab order is mirrored (Plan, Help, Settings run from the right).
- [ ] Numbers show as Arabic-Indic digits where expected, and mixed text (a nickname, a phone number) does not jumble.
- [ ] Switch back to English or Spanish: layout returns to left to right after the reload.
- [ ] A native Arabic reader confirms the wording on every screen, the plan text, the seed activities and the resource descriptions.

## Spanish
- [ ] A native Spanish reader confirms the wording on every screen, the plan text, the seed activities and the resource descriptions.
- [ ] Long Spanish labels (survey options, settings, buttons, the check-in button) do not cut off or overlap.

## Screens and text size
- [ ] On a 360 x 640 screen, nothing is cut off: survey, plan, activity, check-in, settings, help.
- [ ] Fonts load (Figtree for English and Spanish, Noto Sans Arabic for Arabic). No empty boxes.
- [ ] With the system font size at its largest, text grows and stays readable, and buttons are not clipped.
- [ ] Every button is easy to tap with a thumb (at least 48dp).

## TalkBack
- [ ] With TalkBack on, every control is read with a clear label (back, chips, language choices, activity cards, reaction answers, resource links, check-in answers).
- [ ] The reading order makes sense on the plan screen, the activity screen and the check-in.
- [ ] Links open the browser; phone numbers open the dialer.

## Offline
- [ ] Open the app online once, make a plan, and open an activity. Turn on airplane mode and restart the app: the plan, past weeks, children and the free resources (Help tab) still read correctly.
- [ ] In airplane mode, tap "We did it" and pick a reaction. It shows at once. Turn the network back on: the change is sent (check in the API or Atlas).
- [ ] The offline banner appears in airplane mode and goes away online.
- [ ] Making a new plan in airplane mode gives a ready-made plan without an error screen.

## Account and data
- [ ] Sign in with a real email on the Resend sender you verified. The code email arrives (check spam) and shows English, Spanish and Arabic lines.
- [ ] Add a child, make a plan, add a second child, switch between them.
- [ ] A sign-out leaves nothing of the plans on the phone (reopen the app: it asks you to sign in).
- [ ] **Delete my data**: tap it, confirm, then open MongoDB Atlas and check that the parent, children, surveys, plans and auth codes for that email are all gone from `familyforward_dev` (or the database you used). Check the same with the phone in airplane mode: the app must say it could not delete and must not clear anything.
- [ ] Type a note that mentions a health word (for example "speech delay") when making a plan: the plan shows one card that points to the teacher or pediatrician, and the note appears nowhere in Atlas or the API logs.

## Resources (before they go to Benjamin)
- [ ] Work through `docs/RESOURCES_REVIEW.md` row by row. Fix anything marked unverified.

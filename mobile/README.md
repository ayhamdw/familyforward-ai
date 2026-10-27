# FamilyForward mobile

Expo (SDK 58) app with expo-router, TypeScript strict mode, react-i18next (EN/ES/AR) and zustand.

This is the UI with **mock data only**. There are no real network calls: everything goes through
`src/services/api.ts`, which has a mock implementation. Next week, swap that implementation for real HTTP calls.

## Run

```
npm install        # from the repo root
cd mobile
npx expo start
```

Open the app in Expo Go (Android) and scan the QR code. Use Expo Go 58 or newer on Android.

The first `npx expo start` also generates the typed-route definitions in `.expo/types`. Run it once before
`npm run typecheck` on a fresh clone.

## Scripts

| Script | What it does |
|---|---|
| `npm start` | `expo start` |
| `npm test` | Jest + React Native Testing Library |
| `npm run lint` | ESLint (includes a "no text literals in JSX" rule, so UI text must come from i18n) |
| `npm run typecheck` | `tsc --noEmit` |

## Mock sign-in

| Input | Result |
|---|---|
| Any valid-looking email | Goes to the code screen |
| Code `123456` | Signs in |
| Code `000000` (or any other code) | Wrong-code state with a tries counter. After 5 wrong tries the code is locked |
| "Send again" / "Send a new code" | Resets the tries |

After signing in, a new account goes to the survey and an account with a saved plan goes to "Your week".

## Dev menu (development builds only)

Open it with **Settings, then Dev menu**, or **long-press the app name on the welcome screen**. It can jump to:

- Sign in with an invalid email
- Code screen in the wrong-code state (3 tries left)
- Code screen in the expired / too-many-tries state
- Session expired
- Plan in the normal and fallback variants
- Add three sample past weeks

and has two switches:

- **Offline:** shows the offline notice on the plan and disables "make a new plan".
- **Next plan request fails:** the next plan build falls back to the ready-made plan.

The menu is hidden and redirects away in production builds.

## What is stored on the phone

- AsyncStorage keys `familyforward.auth`, `familyforward.survey`, `familyforward.plan` and the language choice.
- The optional survey note is **never** stored, logged or sent. It stays in the note screen's state, and the
  health-word check only decides whether to show the notice.
- "Delete my data" in Settings clears the survey answers, plans and sign-in.

## Content

- Activities come from `packages/shared/src/content/seed-activities.json` (EN/ES/AR) and are shown as written.
- Survey options and the health-word lists live in `packages/shared/src/`.
- UI strings are in `src/i18n/{en,es,ar}.json`. The Spanish and Arabic files are **drafts that need native review**
  (marked with a `_todo` key). Strings copied from the approved design are used as written.

## Manual RTL test

RTL layout cannot be verified from Jest. The tests check that the back chevron flips and that no style uses
left/right, but the real layout needs a device. Run these steps in Expo Go on Android:

1. Run `npx expo start` and open the app in Expo Go on an Android device.
2. On the welcome screen tap **العربية**. The text switches to Arabic right away.
3. In Expo Go the app does not reload by itself (see below). Shake the device, or press `r` in the terminal, to reload.
   Release builds reload automatically.
4. Check each screen in Arabic: text is right-aligned, the back chevron points right, the survey progress bar fills
   from the right, the grid and the tab bar start from the right, list chevrons point left, and the 6 code boxes
   still read left to right.
5. Switch back to English (Settings, then Language), reload manually, and check the layout returns to left-to-right.

Known issue: in Expo Go, an automatic reload right after switching to Arabic crashes the runtime, so it is disabled
in development. The automatic reload path (expo-updates) is untested until there is a development or release build.

## Other manual checks still to do

- Spanish long labels on a small screen (360x640): no clipped text or buttons.
- Arabic and Spanish text with the real fonts (Noto Sans Arabic, Figtree).
- Screen reader (TalkBack): buttons, tabs, selected options and the progress bar announce correctly.
- Large system font size.

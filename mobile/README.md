# FamilyForward mobile

Expo (SDK 58) app with expo-router, TypeScript strict mode, react-i18next (EN/ES/AR) and zustand.

The app talks to the FamilyForward API (see `../api/README.md`). Every network call goes through `src/services/api.ts`.
If the server cannot be reached, the app still shows a plan: it builds the same ready-made plan on the phone. Plans,
children and the free resource directory are saved on the phone, so they read correctly offline, and changes made offline
are queued and sent later. The sign-in token is kept only in the secure store.

Set `EXPO_PUBLIC_API_URL` (copy `.env.example` to `.env`). A real phone needs an https address.

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

## Signing in

Enter your email, then the 6-digit code the API sends. In development without a Resend key the API prints the code in its terminal. A wrong code shows a tries counter (the server allows 5 per code). After sign-in a parent with no child is asked for a nickname, an age band and home languages, then goes through the survey; a returning parent goes to "Your week".

## Dev menu (development builds only)

Open it with **Settings, then Dev menu**, or **long-press the app name on the welcome screen**. It can:

- **Load the demo profile**: a synthetic child ("Demo") and plan kept in memory, with no server calls, so screenshots never show real data
- jump to the sign-in with an invalid email, the wrong-code and expired-code states, and the session-expired screen

and has three switches:

- **Demo profile in use**
- **Offline:** every request fails as if there were no connection (shows the offline banner)
- **Next plan request fails:** the next plan falls back to the ready-made plan built on the phone

The menu is hidden and redirects away in production builds.

## What is stored on the phone

- The sign-in token: only in the secure store (`expo-secure-store`), never in AsyncStorage.
- AsyncStorage keys `familyforward.auth` (email), `familyforward.children`, `familyforward.plans` (current and past plans per child),
  `familyforward.drafts` (survey answers saved midway, per child), `familyforward.queue` (changes waiting to be sent) and the language choice.
- The optional survey note is **never** stored, logged or put in a route. It stays in the note screen and, for one request, in memory.
- Sign out removes everything above except the language choice. **Delete my data** deletes the account on the server first, and only
  when that worked clears everything on the phone, including the language choice. If it fails the parent is told and nothing is cleared.

## Content

- Activities come from `packages/shared/src/content/seed-activities.json` (EN/ES/AR) and are shown as written.
- Survey options, their labels in all three languages, the free resource directory (`resources.json`, works offline), the plan schema and the safety lists live in `packages/shared/src/`.
- UI strings are in `src/i18n/{en,es,ar}.json`. The Spanish and Arabic files are **drafts that need native review**
  (marked with a `_todo` key). Strings copied from the approved design are used as written.

## Manual RTL test

RTL layout cannot be verified from Jest. The tests check that the back chevron flips and that no style uses
left/right, but the real layout needs a device. Run these steps in Expo Go on Android:

1. Run `npx expo start` and open the app in Expo Go on an Android device.
2. On the welcome screen tap **العربية**. The text switches to Arabic right away and a short message asks you to reload the app.
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

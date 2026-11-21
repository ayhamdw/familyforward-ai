# Building the Android app

You need your own Expo login for the cloud build. Nothing here runs `eas build` for you.

## One time

1. Install the tools: `npm install -g eas-cli` (or use `npx eas-cli`).
2. Log in: `eas login`
3. From `mobile/`, link the project to your Expo account: `eas init` (this adds a project id to `app.json`; commit it).
4. Open `mobile/eas.json` and replace the two `REPLACE-WITH-...` values with the https address of your API (the Render service). Android blocks plain `http` by default, so a real phone needs `https`.

## Checks before a build (from `mobile/`)

```
npx expo-doctor                                   # expect 20/20 checks passed
npx expo export --platform android                # proves the app bundles
npm run typecheck && npm run lint && npm test     # all green
```

## Build

```
cd mobile
eas build --profile preview --platform android     # an APK you can install and share
eas build --profile development --platform android # a development client, for testing with a local bundler
```

`eas` prints a link to the finished APK. Open it on the phone and install it (allow installs from your browser when asked).

## What is set

- Android package: `org.chieac.familyforward`
- Version: `0.4.0` (version code 4). Raise `expo.version` and `expo.android.versionCode` in `app.json` for each release.
- `EXPO_PUBLIC_API_URL` per profile is in `eas.json`. For local work, copy `mobile/.env.example` to `mobile/.env` and set it there (that file is not committed).

## Local API on a phone

A real phone cannot reach `localhost`, and plain `http` is blocked. Run the API (`PORT=3001 npm run dev -w api`), expose it with an https tunnel, and use the tunnel address in `mobile/.env`.

# FamilyForward mobile

Expo (SDK 58) app with expo-router, TypeScript strict mode, and EN/ES/AR localization.

## Run

```
npm install        # from the repo root
cd mobile
npx expo start
```

## Manual RTL test

RTL has not been verified on a device. Run these five steps in Expo Go on Android:

1. From `mobile/`, run `npx expo start` and open the app in Expo Go on an Android device.
2. Tap **العربية** to switch to Arabic.
3. In Expo Go the app does not reload by itself. Shake the device (or press `r` in the terminal) to reload manually. Release builds reload automatically.
4. Confirm the text is right-aligned and the language icon row is mirrored (icon on the right, text to its left), and the language buttons start from the right.
5. Tap **English** to switch back, reload manually again and confirm the layout returns to left-to-right.

Known issue: in Expo Go, an automatic reload right after switching to Arabic crashes the runtime, so it is disabled in development. The automatic reload path (expo-updates) is untested until there is a development or release build.

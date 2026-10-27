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
3. Confirm the app reloads by itself.
4. Confirm the text is right-aligned and the language icon row is mirrored (icon on the right, text to its left), and the language buttons start from the right.
5. Tap **English** to switch back, confirm the app reloads again and the layout returns to left-to-right.

If the app does not reload on its own in step 3, close and reopen it once, and note which behavior you saw.

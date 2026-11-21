# Changelog

## Week 1 (Oct 26 to 30, 2026)

By Friday, the repository will be live and an Expo skeleton will be running with English, Spanish and Arabic locales and verified right-to-left (RTL) layout. A deployed API with a health endpoint, connected to MongoDB Atlas, will be up and responding. The Need Statement, survey bank v1, ten seed activities and six low-fidelity screens will be complete.

- Added the Expo skeleton in `mobile/` (expo-router, TypeScript strict) with EN/ES/AR localization, a persisted language choice, and RTL support for Arabic, plus the `@familyforward/shared` workspace package; RTL still needs a manual device check.
- Added the Express API skeleton in `api/` with `/health` and `/health/db` endpoints, Zod environment validation, Mongoose connection, structured logging, rate limiting and graceful shutdown; verified with unit tests only, not yet against a real Atlas database.

## Week 3 (Nov 9 to 13, 2026)

The API grew from sign-in into the full engine: a strict plan schema with easier, harder and notice-this lines, a versioned safety filter in English, Spanish and Arabic, and a complete ready-made plan that the API and the app share. Parents can now add up to four children (a nickname, an age band and home languages), save how each activity went, answer a weekly check-in, and the next plan builds on counts of what worked. A bundled directory of 30 free family resources, Chicago first, and a fixed card that points to the teacher or pediatrician when a note mentions health, were added; nothing was run against the real Claude API or checked by a native reader.

## Week 4 (Nov 16 to 20, 2026)

The app now talks to the real API: sign-in keeps its token in the secure store, children and plans are cached for offline reading, and changes made without a connection are queued and sent later. New screens cover adding a child, the weekly check-in, reactions after each activity, worth-noticing cards and free resources, with all strings in English, Spanish and Arabic, 48dp touch targets and a demo profile for screenshots. The Android bundle builds and expo-doctor passes; a real build, a device check of Arabic layout and TalkBack, and checking the resource directory by hand are still to do (see docs/MANUAL_CHECKS.md).


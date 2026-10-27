# Changelog

## Week 1 (Oct 26 to 30, 2026)

By Friday, the repository will be live and an Expo skeleton will be running with English, Spanish and Arabic locales and verified right-to-left (RTL) layout. A deployed API with a health endpoint, connected to MongoDB Atlas, will be up and responding. The Need Statement, survey bank v1, ten seed activities and six low-fidelity screens will be complete.

- Added the Expo skeleton in `mobile/` (expo-router, TypeScript strict) with EN/ES/AR localization, a persisted language choice, and RTL support for Arabic, plus the `@familyforward/shared` workspace package; RTL still needs a manual device check.
- Added the Express API skeleton in `api/` with `/health` and `/health/db` endpoints, Zod environment validation, Mongoose connection, structured logging, rate limiting and graceful shutdown; verified with unit tests only, not yet against a real Atlas database.

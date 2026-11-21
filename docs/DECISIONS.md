# Decisions

One line each: the decision and why. Newest at the bottom.

1. **Phase order.** Resources (Phase 2) were built before the engine changes (Phase 1) were committed, because the fallback plan needs resource ids. They are committed in dependency order, not phase number order.
2. **Acronyms only as uppercase.** ADD, ODD, OCD (and Spanish TDA, TOC) match only as UPPERCASE whole tokens, because "add", "odd" and "toc" are ordinary words that would hit almost every plan. ADHD and TDAH are not ordinary words, so they match in any case (safer, no false positives).
3. **Extra blocklist terms.** Besides the English starter list I added the contract's own bans (milestone, at risk, grade level, on track, slow learner, below average) and their ES/AR equivalents, because contract rule 2 forbids norm comparisons.
4. **Allow-list is span based.** A hit is ignored only when it sits inside an allow-listed phrase (for example "delayed bedtime"), so the same word elsewhere is still blocked.
5. **All three languages are scanned for every field.** A term slipped into another language is still caught.
6. **Retry names the list term, not the model's text.** On a safety hit the retry prompt lists the blocklist entries that matched. That text is never logged or stored; logs carry only termId, listVersion and fieldPath.
7. **Concern card replaces other notes.** When a note mentions health or development, `worthNoticing` is exactly the one fixed card (no mixing with other cards), `mentionTo` is pediatrician for ages 2-3 and teacher for 4-5, and `noteIgnored` is false so the generic "we didn't use your note" message is not shown.
8. **noteIgnored meaning.** It is true only when a clean note was given but not used because a fallback plan was returned (the fallback never uses notes). It is never true together with the concern card.
9. **Steps 3 to 6.** The contract says three to six steps, so the schema accepts 3 to 6 (it was 3 to 5).
10. **take-turns-tower needs kitchen and toys.** "Plastic cups or soft blocks" now requires both keys, as requested; fewer families will see it.
11. **Resource languages and costs are best guesses.** Where I could not confirm a site's languages or fees I wrote a cautious value and listed it in docs/RESOURCES_REVIEW.md. `checkedOn` is null for anything I could not fetch.
12. **Dropped resources.** Arab American Family Services (the domain I found belongs to another organization), and four URLs that returned 404 or "page not found". Replacements need a URL a human has opened.
13. **Phones.** Only three phones appear: Chicago Early Learning, CPS Child Find and the Illinois EI Clearinghouse office, each read from the official page. 211 stays null because the number was not in the page text.
14. **Illinois Early Intervention cost is "low".** Evaluation is free but some services may carry a family fee; a human should confirm.
15. **Fallback feedback.** Last week's "didn't work" activities are skipped only if enough other activities remain; loved focus areas are tried first.
16. **Existing seed content kept.** The blow-out-a-candle step in flower-breath is kept; it is pretend play and is not on the unsafe list.
17. **Port.** The API README and Postman use port 3001 because another app on this machine holds 3000; the default stays 3000 in code.
18. **Only one plan per child per week unless regenerate.** A second POST without `regenerate: true` returns 409 `plan_exists` (the app then shows the existing plan). Replaced plans are kept but hidden (`replacedAt`) so the daily limit still counts them.
19. **Daily limit counts regenerates.** Counted from plans created in the last 24 hours, including replaced ones.
20. **Children are scoped by parent in every query.** Someone else's or a malformed id is the same plain 404, so ids cannot be probed.
21. **Deleting a child deletes their plans and surveys.** Deleting the parent deletes everything. Plans are not kept after their child is removed.
22. **Feedback leaves the server only as counts.** The prompt gets per-focus counts of done activities and reactions and the check-in answer counts; never titles or text.
23. **Local ready-made plans.** If the server cannot be reached the app builds the shared fallback itself (id starts with `local-`). Changes to such a plan are kept on the phone only and are not queued, because the server does not know the plan.
24. **Offline status without a new dependency.** The app treats the network as offline when the last request failed to connect, instead of adding NetInfo. The banner clears after the next successful request.
25. **Sign-out keeps only the language choice.** Everything else (token, plans, children, drafts, queue) is removed. Delete my data removes the language choice too, and only after the server confirmed the deletion; if it fails, nothing is cleared and the parent is told.
26. **Survey branching.** There is no age screen (it comes from the child). A saved draft, or last week's answers kept after a plan is built, resumes at the furthest step reached, with earlier steps underneath so Back works. The note is never part of a draft.
27. **The note travels in memory only.** `noteHolder` keeps it from the note screen to the plan request and clears it the moment it is read. It is not in route params, stores, drafts or logs.
28. **Wrong-code count.** The server does not return remaining tries, so the app counts down from 5 on its own. The server still enforces the limit.
29. **Dev menu demo profile.** Uses an in-memory synthetic API (nickname "Demo", fixed answers) so screenshots never hold real data. It never calls the server.
30. **Touch target token raised to 48dp.** Buttons, chips, cards, resource rows and reaction answers all have a 48dp minimum height, checked by a test.
31. **eas.json URLs are placeholders.** The real API address is not known to me. Replace `REPLACE-WITH-...` before building. No http (cleartext) setup was added because Android blocks it; a local API needs an https tunnel.
32. **Expo patch versions aligned.** `expo-doctor` asked for 13 patch updates; they were applied with `expo install --fix` and the lock file was re-resolved so there are no duplicate native modules.
33. **No new tracking.** The only new dependency is `expo-secure-store` (Expo's own module, uses the OS keystore). The rest are Expo patch bumps.


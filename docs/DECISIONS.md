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

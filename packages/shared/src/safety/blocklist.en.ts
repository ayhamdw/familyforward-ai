import type { BlocklistFile } from "./types";

// English starter list (Appendix C) plus the contract's own bans: norms, milestones, "at risk".
export const blocklistEn: BlocklistFile = {
  lang: "en",
  terms: [
    "ADHD", "attention deficit", "autism", "autistic", "spectrum", "dyslexia", "dyslexic", "dyscalculia",
    "dysgraphia", "learning disability", "learning disorder", "developmental delay", "speech delay",
    "language delay", "language disorder", "apraxia", "sensory processing", "oppositional", "anxiety disorder",
    "depression", "depressed", "intellectual disability", "cognitive impairment", "gifted", "diagnosis",
    "diagnose", "diagnosed", "disorder", "syndrome", "deficit", "delayed", "behind for his age",
    "behind for her age", "behind other children", "at risk for", "symptom", "symptoms", "condition",
    "screening", "screen for", "assessment", "evaluation for", "red flag", "warning sign", "abnormal",
    "not normal",
    // Contract rule 2: no norms, milestones or labels like "at risk".
    "milestone", "milestones", "at risk", "grade level", "on track", "off track", "late talker",
    "slow learner", "below average", "above average",
  ],
  uppercaseOnly: ["ADD", "ODD", "OCD"],
};

import { AGE_BANDS, DAYS_OPTIONS, FOCUS_AREAS, LANGUAGES, MATERIALS, MINUTES_OPTIONS, type SurveyInput } from "@familyforward/shared";

export const SURVEY: SurveyInput = {
  language: "en",
  ageBand: "2-3",
  focusAreas: ["talking"],
  interests: ["songs"],
  materials: ["paper", "kitchen"],
  minutesPerDay: 10,
  daysPerWeek: 3,
};

/** Every combination of language, age band, minutes, days and a few focus and material sets. */
export function allSurveys(): SurveyInput[] {
  const focusSets = [...FOCUS_AREAS.map((f) => [f]), ["talking", "reading"], ["movement", "feelings"]];
  const materialSets: SurveyInput["materials"][] = [[], ["paper"], [...MATERIALS]];
  const out: SurveyInput[] = [];
  for (const language of LANGUAGES)
    for (const ageBand of AGE_BANDS)
      for (const minutesPerDay of MINUTES_OPTIONS)
        for (const daysPerWeek of DAYS_OPTIONS)
          for (const focusAreas of focusSets)
            for (const materials of materialSets)
              out.push({ language, ageBand, focusAreas: focusAreas as SurveyInput["focusAreas"], interests: [], materials, minutesPerDay, daysPerWeek });
  return out;
}

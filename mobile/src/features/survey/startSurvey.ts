import { activeChild, useChildrenStore } from "@/storage/childrenStore";
import { useSurveyStore } from "@/storage/surveyStore";

export const SURVEY_ROUTES = ["/survey/focus", "/survey/time", "/survey/interests", "/survey/materials", "/survey/note"] as const;

type Router = { push: (href: never) => void };

/**
 * Opens the survey for the active child. A saved draft (or last week's answers) resumes at the
 * furthest step reached, with the earlier steps underneath so Back still works. With no child
 * yet, it asks for one first.
 */
export function startSurvey(router: Router, options: { fresh?: boolean } = {}): void {
  const child = activeChild(useChildrenStore.getState());
  if (!child) {
    router.push("/children/new" as never);
    return;
  }
  const survey = useSurveyStore.getState();
  survey.loadForChild(child.id);
  const step = options.fresh ? 1 : Math.min(Math.max(useSurveyStore.getState().step, 1), SURVEY_ROUTES.length);
  for (let i = 0; i < step; i += 1) {
    router.push(SURVEY_ROUTES[i] as never);
  }
}

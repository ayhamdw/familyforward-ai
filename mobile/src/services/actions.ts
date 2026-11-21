import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ChildDto, ChildInput, CheckInAnswer, Language, PlanDto, Reaction } from "@familyforward/shared";
import { buildLocalPlan, isLocalPlan } from "@/features/plan/buildPlan";
import { useAuthStore } from "@/storage/authStore";
import { useChildrenStore } from "@/storage/childrenStore";
import { useDraftStore } from "@/storage/draftStore";
import { useNetStore } from "@/storage/netStore";
import { findPlan, selectChildPlans, usePlanStore } from "@/storage/planStore";
import { useQueueStore } from "@/storage/queueStore";
import { useSurveyStore, type SurveyAnswers } from "@/storage/surveyStore";
import { api } from "./api";
import { ApiError } from "./http";
import { clearToken, setToken } from "./session";
import { flushQueue } from "./sync";

const LANGUAGE_KEYS = ["familyforward.language", "familyforward.directionReloadFor"];

/** True for failures that just mean "no connection right now". */
export const isOfflineError = (error: unknown): boolean =>
  error instanceof ApiError && (error.kind === "offline" || error.kind === "timeout");

/** Verifies the code. On success the token goes to the secure store and the parent is signed in. */
export async function signInWithCode(email: string, code: string) {
  const result = await api.verifyCode(email, code);
  if (result.status === "ok") {
    await setToken(result.token);
    useAuthStore.getState().signIn(email);
    void refreshAll();
  }
  return result;
}

export async function refreshChildren(): Promise<ChildDto[]> {
  const children = await api.listChildren();
  useChildrenStore.getState().setChildren(children);
  return children;
}

export async function refreshPlans(childId: string): Promise<void> {
  const [current, past] = await Promise.all([api.currentPlan(childId), api.pastPlans(childId)]);
  const store = usePlanStore.getState();
  const cached = selectChildPlans(store.byChild, childId).current;
  // Keep a plan made on this phone while offline until the server has one for the week.
  store.setCurrent(childId, current ?? (cached && isLocalPlan(cached) ? cached : null));
  store.setPast(childId, past);
}

/** Best-effort refresh from the server. Offline is fine: the cached copies stay. */
export async function refreshAll(): Promise<void> {
  try {
    await flushQueue();
    const children = await refreshChildren();
    const active = useChildrenStore.getState().activeChildId ?? children[0]?.id;
    if (active) await refreshPlans(active);
  } catch {
    // Offline or signed out: nothing to do. The screens read the cache.
  }
}

export async function saveChild(input: ChildInput, id?: string): Promise<ChildDto> {
  const child = id ? await api.updateChild(id, input) : await api.createChild(input);
  useChildrenStore.getState().upsert(child);
  return child;
}

export async function removeChild(id: string): Promise<void> {
  await api.deleteChild(id);
  useChildrenStore.getState().remove(id);
  usePlanStore.getState().removeChild(id);
  useDraftStore.getState().discard(id);
}

export type GenerateRequest = {
  child: ChildDto;
  answers: SurveyAnswers;
  language: Language;
  /** Used for this one request. Never stored. */
  note?: string;
  regenerate?: boolean;
};

/**
 * Builds this week's plan. If the server cannot make one (offline, slow, error), the parent still
 * gets a ready-made plan built on the phone, with no error screen. Auth errors are not hidden.
 */
export async function generatePlan(req: GenerateRequest): Promise<{ plan: PlanDto; noteIgnored: boolean }> {
  const store = usePlanStore.getState();
  const previous = selectChildPlans(store.byChild, req.child.id).current;
  const previousId = previous && !isLocalPlan(previous) ? previous.id : undefined;
  try {
    const { noteIgnored, ...plan } = await api.createPlan({
      childId: req.child.id,
      answers: req.answers,
      language: req.language,
      note: req.note,
      regenerate: req.regenerate,
      previousPlanId: req.regenerate ? previousId : undefined,
    });
    store.setCurrent(req.child.id, plan);
    return { plan, noteIgnored: noteIgnored ?? false };
  } catch (error) {
    if (error instanceof ApiError && error.kind === "unauthorized") throw error;
    if (error instanceof ApiError && error.code === "plan_exists") {
      const existing = await api.currentPlan(req.child.id).catch(() => null);
      if (existing) {
        store.setCurrent(req.child.id, existing);
        return { plan: existing, noteIgnored: false };
      }
    }
    const plan = buildLocalPlan(req.child, req.answers, req.language, { note: req.note });
    store.setCurrent(req.child.id, plan);
    return { plan, noteIgnored: false };
  }
}

/** Saves an activity change on the phone first, then sends it (or queues it when offline). */
export async function recordActivity(planId: string, index: number, patch: { done: boolean; reaction: Reaction | null }): Promise<void> {
  const found = usePlanStore.getState().patchActivity(planId, index, patch);
  if (!found || planId.startsWith("local-")) return;
  useQueueStore.getState().enqueue({ type: "activity", planId, index, ...patch });
  await flushQueue();
}

export async function recordCheckIn(planId: string, answers: CheckInAnswer[]): Promise<void> {
  usePlanStore.getState().setCheckInAnswers(planId, answers);
  if (planId.startsWith("local-") || !findPlan(usePlanStore.getState().byChild, planId)) return;
  useQueueStore.getState().enqueue({ type: "checkin", planId, answers });
  await flushQueue();
}

/** Clears every store and everything saved on the phone. Language choice is kept unless `everything`. */
export async function wipeLocal(options: { everything?: boolean } = {}): Promise<void> {
  await clearToken();
  useQueueStore.getState().clear();
  usePlanStore.getState().clear();
  useChildrenStore.getState().clear();
  useDraftStore.getState().clear();
  useSurveyStore.getState().reset();
  useNetStore.getState().setOnline(true);
  useAuthStore.getState().signOut();
  const stores = [useQueueStore, usePlanStore, useChildrenStore, useDraftStore, useAuthStore];
  await Promise.all(stores.map((s) => s.persist.clearStorage()));
  const keys = await AsyncStorage.getAllKeys();
  const keep = options.everything ? [] : LANGUAGE_KEYS;
  const remove = keys.filter((k) => !keep.includes(k));
  if (remove.length > 0) await AsyncStorage.multiRemove(remove);
}

export const signOutAll = (): Promise<void> => wipeLocal();

/**
 * Deletes the account on the server first. Only when that worked is the phone cleared, so a
 * failed request never leaves the parent thinking the data is gone. Throws on failure.
 */
export async function deleteMyData(): Promise<void> {
  await api.deleteMe();
  await wipeLocal({ everything: true });
}

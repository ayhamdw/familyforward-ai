import { useNetStore } from "@/storage/netStore";
import { useQueueStore } from "@/storage/queueStore";
import { api } from "./api";
import { ApiError } from "./http";

let flushing: Promise<void> | null = null;

/**
 * Sends queued writes in order. Stops at the first network failure (it will run again later);
 * drops a write the server says no longer exists. Safe to call at any time.
 */
export function flushQueue(): Promise<void> {
  if (flushing) return flushing;
  flushing = (async () => {
    for (const item of [...useQueueStore.getState().items]) {
      try {
        if (item.type === "activity") {
          await api.updateActivity(item.planId, item.index, { done: item.done, reaction: item.reaction });
        } else {
          await api.submitCheckIn(item.planId, item.answers);
        }
        useQueueStore.getState().remove(item.id);
      } catch (error) {
        if (error instanceof ApiError && (error.kind === "offline" || error.kind === "timeout" || error.kind === "server")) {
          return;
        }
        if (error instanceof ApiError && error.kind === "unauthorized") {
          return;
        }
        // The server refused this write for good (for example the plan was deleted): drop it.
        useQueueStore.getState().remove(item.id);
      }
    }
    useNetStore.getState().setOnline(true);
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

export const pendingWrites = (): number => useQueueStore.getState().items.length;

/**
 * Carries the optional survey note from the note screen to the plan request, in memory only.
 * It is never written to storage, never put in a route, and cleared the moment it is taken.
 */
let pending: string | undefined;

export function holdNote(note: string): void {
  pending = note.trim() === "" ? undefined : note;
}

export function takeNote(): string | undefined {
  const note = pending;
  pending = undefined;
  return note;
}

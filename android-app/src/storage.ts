import { Preferences } from "@capacitor/preferences";
import type { SolvedResponse } from "@shared/types/api";

const KEY = "cube-solver-android-session-v1";
export type Session = {
  version: 1;
  visualFacelets: string;
  solverFacelets: string;
  solution: SolvedResponse | null;
  step: number;
};
export const EMPTY: Session = {
  version: 1,
  visualFacelets: "X".repeat(54),
  solverFacelets: "",
  solution: null,
  step: 0,
};

function parse(value: string | null): Session {
  try {
    const item = value ? (JSON.parse(value) as Partial<Session>) : null;
    if (!item) return EMPTY;
    return {
      version: 1,
      visualFacelets:
        typeof item.visualFacelets === "string" &&
        item.visualFacelets.length === 54
          ? item.visualFacelets
          : EMPTY.visualFacelets,
      solverFacelets:
        typeof item.solverFacelets === "string" ? item.solverFacelets : "",
      solution: item.solution?.status === "solved" ? item.solution : null,
      step:
        Number.isInteger(item.step) && (item.step ?? -1) >= 0 ? item.step! : 0,
    };
  } catch {
    return EMPTY;
  }
}

export async function loadSession(): Promise<Session> {
  return parse((await Preferences.get({ key: KEY })).value);
}
export async function saveSession(session: Session): Promise<void> {
  await Preferences.set({ key: KEY, value: JSON.stringify(session) });
}
export async function clearSession(): Promise<void> {
  await Preferences.remove({ key: KEY });
}

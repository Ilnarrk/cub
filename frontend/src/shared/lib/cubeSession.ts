const KEY = 'cube-solver-session-v1';

export type CubeSession = { visualFacelets: string; solverFacelets: string };

const EMPTY_SESSION: CubeSession = { visualFacelets: 'X'.repeat(54), solverFacelets: '' };

export function loadCubeSession(): CubeSession {
  try {
    const value = sessionStorage.getItem(KEY);
    if (!value) return EMPTY_SESSION;
    const parsed = JSON.parse(value) as Partial<CubeSession>;
    return { visualFacelets: typeof parsed.visualFacelets === 'string' ? parsed.visualFacelets : EMPTY_SESSION.visualFacelets, solverFacelets: typeof parsed.solverFacelets === 'string' ? parsed.solverFacelets : '' };
  } catch { return EMPTY_SESSION; }
}

export function saveCubeSession(session: CubeSession): void {
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function clearCubeSession(): void {
  sessionStorage.removeItem(KEY);
}

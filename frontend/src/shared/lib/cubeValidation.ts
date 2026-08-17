import { FACE_NAMES } from '@shared/constants/cube';
import type { FaceName } from '@shared/types/api';

export type CubeIssue = { code: string; message: string; indices: number[] };
const CENTRE_INDICES = [4, 13, 22, 31, 40, 49];

const EDGE_POSITIONS = [[5, 10], [7, 19], [3, 37], [1, 46], [32, 16], [28, 25], [30, 43], [34, 52], [23, 12], [21, 41], [50, 39], [48, 14]];
const CORNER_POSITIONS = [[8, 9, 20], [6, 18, 38], [0, 36, 47], [2, 45, 11], [29, 26, 15], [27, 44, 24], [33, 53, 42], [35, 17, 51]];
const VALID_EDGES = new Set(['UR', 'UF', 'UL', 'UB', 'DR', 'DF', 'DL', 'DB', 'FR', 'FL', 'BL', 'BR'].map(signature));
const VALID_CORNERS = new Set(['URF', 'UFL', 'ULB', 'UBR', 'DFR', 'DLF', 'DBL', 'DRB'].map(signature));

function signature(value: string) { return value.split('').sort().join(''); }

function pieceIssues(facelets: string, positions: number[][], valid: Set<string>, kind: 'ребра' | 'угла'): CubeIssue[] {
  const seen = new Map<string, number[][]>();
  const issues: CubeIssue[] = [];
  positions.forEach((indices) => {
    const value = signature(indices.map((index) => facelets[index]).join(''));
    if (!valid.has(value)) issues.push({ code: `invalid-${kind}`, message: `Недопустимая комбинация цветов ${kind}.`, indices });
    const entries = seen.get(value) ?? [];
    entries.push(indices);
    seen.set(value, entries);
  });
  seen.forEach((entries) => {
    if (entries.length > 1 && valid.has(signature(entries[0].map((index) => facelets[index]).join('')))) issues.push({ code: `duplicate-${kind}`, message: `Одинаковая деталь ${kind} указана несколько раз.`, indices: entries.flat() });
  });
  return issues;
}

export function validateCubeLocally(facelets: string): CubeIssue[] {
  if (facelets.length !== 54) return [{ code: 'length', message: 'Нужно заполнить все 54 стикера.', indices: [] }];
  const emptyCount = [...facelets].filter((value) => value === 'X').length;
  if (emptyCount > 0) return [{ code: 'incomplete', message: `Раскрасьте все стикеры: осталось ${emptyCount}.`, indices: [] }];
  const issues: CubeIssue[] = [];
  FACE_NAMES.forEach((color: FaceName) => {
    const indices = [...facelets].flatMap((value, index) => value === color ? [index] : []);
    if (indices.length !== 9) issues.push({ code: `count-${color}`, message: `Цвет «${color}»: ${indices.length} из 9.`, indices: indices.length > 9 ? indices : [] });
  });
  issues.push(...pieceIssues(facelets, EDGE_POSITIONS, VALID_EDGES, 'ребра'));
  issues.push(...pieceIssues(facelets, CORNER_POSITIONS, VALID_CORNERS, 'угла'));
  return issues;
}

/** Maps the user-selected centre colours to the solver's U/R/F/D/L/B axes. */
export function normalizeFaceletsByCentres(facelets: string): string | null {
  if (facelets.length !== 54 || facelets.includes('X')) return null;
  const centres = CENTRE_INDICES.map((index) => facelets[index]);
  if (new Set(centres).size !== FACE_NAMES.length || centres.some((colour) => !FACE_NAMES.includes(colour as FaceName))) return null;
  const mapping = new Map(centres.map((colour, index) => [colour, FACE_NAMES[index]]));
  return [...facelets].map((colour) => mapping.get(colour) ?? colour).join('');
}

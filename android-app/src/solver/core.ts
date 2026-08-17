import Cube from "cubejs";
import type {
  Move,
  SolvedResponse,
  ValidationResponse,
} from "@shared/types/api";

export const SOLVED =
  "U".repeat(9) +
  "R".repeat(9) +
  "F".repeat(9) +
  "D".repeat(9) +
  "L".repeat(9) +
  "B".repeat(9);
let initialized = false;

export function isRequestCurrent(
  requestedFacelets: string,
  currentFacelets: string,
): boolean {
  return requestedFacelets === currentFacelets;
}

export function initializeCore(): void {
  if (!initialized) {
    Cube.initSolver();
    initialized = true;
  }
}

export function validatePhysical(facelets: string): ValidationResponse {
  if (!/^[URFDLB]{54}$/.test(facelets))
    return { valid: false, detail: "Нужно заполнить все 54 стикера." };
  if (
    [..."URFDLB"].some(
      (face) => [...facelets].filter((value) => value === face).length !== 9,
    )
  ) {
    return {
      valid: false,
      detail: "Каждый цвет должен встречаться ровно 9 раз.",
    };
  }
  if (
    [4, 13, 22, 31, 40, 49].map((index) => facelets[index]).join("") !==
    "URFDLB"
  ) {
    return {
      valid: false,
      detail: "Центры должны задавать порядок U R F D L B.",
    };
  }
  try {
    const cube = Cube.fromString(facelets);
    if (
      new Set(cube.cp).size !== 8 ||
      cube.cp.some((value) => value < 0 || value > 7)
    )
      return {
        valid: false,
        detail:
          "Один из углов повторяется или содержит невозможную комбинацию цветов.",
      };
    if (
      new Set(cube.ep).size !== 12 ||
      cube.ep.some((value) => value < 0 || value > 11)
    )
      return {
        valid: false,
        detail:
          "Одно из рёбер повторяется или содержит невозможную комбинацию цветов.",
      };
    if (cube.co.reduce((sum, value) => sum + value, 0) % 3 !== 0)
      return {
        valid: false,
        detail: "Один из углов повёрнут физически невозможным образом.",
      };
    if (cube.eo.reduce((sum, value) => sum + value, 0) % 2 !== 0)
      return {
        valid: false,
        detail: "Одно из рёбер перевёрнуто физически невозможным образом.",
      };
    if (permutationParity(cube.cp) !== permutationParity(cube.ep))
      return {
        valid: false,
        detail:
          "Перестановка деталей физически невозможна. Проверьте введённые цвета.",
      };
  } catch {
    return { valid: false, detail: "Такое состояние физически невозможно." };
  }
  return { valid: true };
}

function permutationParity(values: number[]): number {
  let inversions = 0;
  for (let left = 0; left < values.length; left += 1) {
    for (let right = left + 1; right < values.length; right += 1)
      if (values[left] > values[right]) inversions += 1;
  }
  return inversions % 2;
}

function parseMove(notation: string): Move {
  return {
    notation,
    face: notation[0] as Move["face"],
    clockwise: !notation.includes("'"),
    double: notation.includes("2"),
  };
}

export function solveSync(facelets: string): SolvedResponse {
  const validation = validatePhysical(facelets);
  if (!validation.valid)
    throw new Error(validation.detail ?? "Недопустимый куб.");
  if (facelets === SOLVED)
    return {
      status: "solved",
      moves: [],
      move_count: 0,
      solution_string: "",
      optimal: false,
    };
  initializeCore();
  const solution = Cube.fromString(facelets).solve().trim();
  const moves = solution ? solution.split(/\s+/).map(parseMove) : [];
  return {
    status: "solved",
    moves,
    move_count: moves.length,
    solution_string: solution,
    optimal: false,
  };
}

export function randomSync(random: () => number = Math.random): string {
  const faces = ["U", "R", "F", "D", "L", "B"];
  const suffixes = ["", "'", "2"];
  const moves: string[] = [];
  let previous = "";
  for (let index = 0; index < 28; index += 1) {
    const available = faces.filter((face) => face !== previous);
    const face = available[Math.floor(random() * available.length)];
    moves.push(face + suffixes[Math.floor(random() * suffixes.length)]);
    previous = face;
  }
  return new Cube().move(moves.join(" ")).asString();
}

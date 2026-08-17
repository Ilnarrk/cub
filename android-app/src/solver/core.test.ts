import { describe, expect, it } from "vitest";
import { applyMove } from "@widgets/Cube3D";
import {
  isRequestCurrent,
  randomSync,
  SOLVED,
  solveSync,
  validatePhysical,
} from "./core";

function seeded(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function swap(state: string, ...pairs: Array<[number, number]>): string {
  const values = [...state];
  for (const [left, right] of pairs)
    [values[left], values[right]] = [values[right], values[left]];
  return values.join("");
}

describe("offline cube solver", () => {
  it("returns no moves for a solved cube", () => {
    expect(solveSync(SOLVED).moves).toEqual([]);
  });

  it("rejects invalid centres and a flipped edge", () => {
    expect(validatePhysical(swap(SOLVED, [4, 13])).valid).toBe(false);
    expect(validatePhysical(swap(SOLVED, [5, 10])).valid).toBe(false);
  });

  it("rejects a twisted corner and odd edge permutation", () => {
    const corner = [...SOLVED];
    [corner[8], corner[9], corner[20]] = [corner[9], corner[20], corner[8]];
    expect(validatePhysical(corner.join("")).valid).toBe(false);
    expect(validatePhysical(swap(SOLVED, [5, 7], [10, 19])).valid).toBe(false);
  });

  it("does not accept a stale result", () => {
    expect(isRequestCurrent(SOLVED, SOLVED)).toBe(true);
    expect(isRequestCurrent(SOLVED, randomSync(seeded(3)))).toBe(false);
  });

  it("solves 100 deterministic legal states", { timeout: 120_000 }, () => {
    for (let index = 0; index < 100; index += 1) {
      const state = randomSync(seeded(index + 1));
      expect(validatePhysical(state).valid).toBe(true);
      const result = solveSync(state);
      const solved = result.moves.reduce(
        (cube, move) => applyMove(cube, move.notation),
        state,
      );
      expect(solved).toBe(SOLVED);
    }
  });
});

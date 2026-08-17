declare module "cubejs" {
  export default class Cube {
    readonly center: number[];
    readonly cp: number[];
    readonly co: number[];
    readonly ep: number[];
    readonly eo: number[];
    constructor(other?: Cube);
    static initSolver(): void;
    static fromString(facelets: string): Cube;
    asString(): string;
    move(algorithm: string): Cube;
    solve(maxDepth?: number): string;
  }
}

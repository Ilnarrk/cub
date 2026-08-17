export type FaceName = "U" | "R" | "F" | "D" | "L" | "B";

export interface SolveRequest {
  facelets: string;
}
export interface ValidationResponse {
  valid: boolean;
  detail?: string | null;
}
export interface RandomCubeResponse {
  facelets: string;
}
export interface Move {
  notation: string;
  face: FaceName;
  clockwise: boolean;
  double: boolean;
}
export interface SolvedResponse {
  status: "solved";
  moves: Move[];
  move_count: number;
  solution_string: string;
  optimal: boolean;
}
export interface PendingResponse {
  status: "pending";
  job_id: string;
  poll_after_ms: number;
}
export interface FailedResponse {
  status: "failed";
  detail: string;
}
export type SolveResponse = SolvedResponse | PendingResponse | FailedResponse;

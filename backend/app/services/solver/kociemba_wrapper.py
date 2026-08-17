"""A bounded worker around the available two-phase solver.

The response deliberately exposes that Kociemba is a candidate, not a proof of
God's-number optimality.  A production exact engine plugs into the same job API.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

import kociemba


@dataclass(frozen=True)
class CandidateSolution:
    notation: str
    optimal: bool = False


def solve_candidate(facelets: str) -> CandidateSolution:
    try:
        return CandidateSolution(kociemba.solve(facelets))
    except Exception as exc:  # kociemba exposes several implementation-specific errors
        raise ValueError(f"Недопустимая конфигурация куба: {exc}") from exc


async def solve_candidate_async(facelets: str) -> CandidateSolution:
    return await asyncio.to_thread(solve_candidate, facelets)

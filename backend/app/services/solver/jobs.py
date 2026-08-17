"""In-memory solve jobs.  Jobs intentionally retain no image data."""

from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass

from app.services.solver.kociemba_wrapper import CandidateSolution, solve_candidate_async


@dataclass
class SolveJob:
    id: str
    created_at: float
    state: str = "pending"
    result: CandidateSolution | None = None
    error: str | None = None


class SolveJobs:
    def __init__(self) -> None:
        self._jobs: dict[str, SolveJob] = {}

    def create(self, facelets: str) -> SolveJob:
        self._purge()
        job = SolveJob(id=uuid.uuid4().hex, created_at=time.monotonic())
        self._jobs[job.id] = job
        asyncio.create_task(self._run(job, facelets))
        return job

    async def _run(self, job: SolveJob, facelets: str) -> None:
        try:
            job.result = await solve_candidate_async(facelets)
            job.state = "solved"
        except ValueError as exc:
            job.error = str(exc)
            job.state = "failed"

    def get(self, job_id: str) -> SolveJob | None:
        self._purge()
        return self._jobs.get(job_id)

    def _purge(self) -> None:
        now = time.monotonic()
        self._jobs = {key: job for key, job in self._jobs.items() if now - job.created_at < 900}


solve_jobs = SolveJobs()

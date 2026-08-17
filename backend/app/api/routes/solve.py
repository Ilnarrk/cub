"""Cube solving endpoints."""

import asyncio
import random

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.schemas.cube import FailedResponse, Move, PendingResponse, RandomCubeResponse, SolveRequest, SolvedResponse, ValidationResponse
from app.services.cube_model.state import CubeState, CubeValidationError
from app.services.solver.jobs import solve_jobs
from kociemba.pykociemba.cubiecube import CubieCube, moveCube

router = APIRouter(tags=["solver"])


@router.post("/validate", response_model=ValidationResponse)
async def validate(request: SolveRequest) -> ValidationResponse:
    try:
        state = CubeState(request.facelets)
        state.validate_basic()
        state.validate_physical()
        return ValidationResponse(valid=True)
    except CubeValidationError as exc:
        return ValidationResponse(valid=False, detail=str(exc))


@router.get("/random-state", response_model=RandomCubeResponse)
async def random_state() -> RandomCubeResponse:
    """Create a state by legal moves, guaranteeing compatibility."""
    cube = CubieCube()
    previous_face = -1
    for _ in range(28):
        face = random.randrange(6)
        while face == previous_face:
            face = random.randrange(6)
        for _ in range(random.randint(1, 3)):
            cube.multiply(moveCube[face])
        previous_face = face
    return RandomCubeResponse(facelets=cube.toFaceCube().to_String())


def _response_for(job) -> SolvedResponse | PendingResponse | FailedResponse:
    if job.state == "pending":
        return PendingResponse(job_id=job.id)
    if job.state == "failed":
        return FailedResponse(detail=job.error or "Поиск не удался")
    candidate = job.result
    assert candidate is not None
    tokens = candidate.notation.split()
    moves = [Move(notation=token, face=token[0], clockwise="'" not in token, double="2" in token) for token in tokens]
    return SolvedResponse(moves=moves, move_count=len(moves), solution_string=candidate.notation, optimal=candidate.optimal)


@router.post("/solve", response_model=SolvedResponse | PendingResponse | FailedResponse)
async def solve(request: SolveRequest):
    try:
        state = CubeState(request.facelets)
        state.validate_basic()
        state.validate_physical()
    except CubeValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    job = solve_jobs.create(request.facelets)
    try:
        await asyncio.wait_for(_wait(job.id), timeout=10)
    except TimeoutError:
        return JSONResponse(status_code=202, content=PendingResponse(job_id=job.id).model_dump())
    response = _response_for(job)
    return JSONResponse(status_code=202 if isinstance(response, PendingResponse) else 200, content=response.model_dump())


async def _wait(job_id: str) -> None:
    while (job := solve_jobs.get(job_id)) is not None and job.state == "pending":
        await asyncio.sleep(0.05)


@router.get("/solve-jobs/{job_id}", response_model=SolvedResponse | PendingResponse | FailedResponse)
async def solve_job(job_id: str):
    job = solve_jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Задание истекло или не найдено")
    response = _response_for(job)
    return JSONResponse(status_code=202 if isinstance(response, PendingResponse) else 200, content=response.model_dump())

"""Pydantic schemas for the public cube API."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator


FACE_ORDER = "URFDLB"


class SolveRequest(BaseModel):
    facelets: str = Field(min_length=54, max_length=54, pattern=r"^[URFDLB]{54}$")

    @field_validator("facelets")
    @classmethod
    def normalize(cls, value: str) -> str:
        return value.upper().strip()


class ValidationResponse(BaseModel):
    valid: bool
    detail: str | None = None


class RandomCubeResponse(BaseModel):
    facelets: str = Field(min_length=54, max_length=54, pattern=r"^[URFDLB]{54}$")


class Move(BaseModel):
    notation: str = Field(pattern=r"^[URFDLB][2']?$")
    face: Literal["U", "R", "F", "D", "L", "B"]
    clockwise: bool
    double: bool


class SolvedResponse(BaseModel):
    status: Literal["solved"] = "solved"
    moves: list[Move]
    move_count: int
    solution_string: str
    optimal: bool


class PendingResponse(BaseModel):
    status: Literal["pending"] = "pending"
    job_id: str
    poll_after_ms: int = 1000


class FailedResponse(BaseModel):
    status: Literal["failed"] = "failed"
    detail: str


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.2.0"

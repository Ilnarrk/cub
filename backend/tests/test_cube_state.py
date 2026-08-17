import pytest

from app.services.cube_model.state import CubeState, CubeValidationError


SOLVED = "U" * 9 + "R" * 9 + "F" * 9 + "D" * 9 + "L" * 9 + "B" * 9


def test_solved_state_passes_basic_validation() -> None:
    state = CubeState(SOLVED)
    state.validate_basic()
    assert state.is_solved()


def test_wrong_colour_count_is_rejected() -> None:
    with pytest.raises(CubeValidationError, match="ровно 9"):
        CubeState("U" * 10 + SOLVED[10:]).validate_basic()


def test_wrong_centre_is_rejected() -> None:
    invalid = list(SOLVED)
    invalid[4] = "R"
    invalid[13] = "U"
    with pytest.raises(CubeValidationError, match="Центральные"):
        CubeState("".join(invalid)).validate_basic()


def test_flipped_edge_is_rejected_before_solving() -> None:
    # The UR edge is represented by U6 and R2 in the facelet string.
    invalid = list(SOLVED)
    invalid[5], invalid[10] = invalid[10], invalid[5]
    state = CubeState("".join(invalid))
    state.validate_basic()
    with pytest.raises(CubeValidationError, match="перевёрнуто"):
        state.validate_physical()

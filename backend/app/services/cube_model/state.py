"""Validation and small immutable helpers for cube facelets."""

from collections import Counter

from kociemba.pykociemba.facecube import FaceCube

FACE_ORDER = "URFDLB"
CENTRE_INDICES = (4, 13, 22, 31, 40, 49)


class CubeValidationError(ValueError):
    """A cube representation cannot describe a physical 3x3 cube."""


class CubeState:
    def __init__(self, facelets: str) -> None:
        self.facelets = facelets

    def validate_basic(self) -> None:
        if len(self.facelets) != 54 or any(face not in FACE_ORDER for face in self.facelets):
            raise CubeValidationError("Нужна строка из 54 символов U, R, F, D, L, B.")
        counts = Counter(self.facelets)
        invalid = [face for face in FACE_ORDER if counts[face] != 9]
        if invalid:
            raise CubeValidationError("На каждой грани должно быть ровно 9 стикеров: " + ", ".join(invalid))
        centres = "".join(self.facelets[index] for index in CENTRE_INDICES)
        if centres != FACE_ORDER:
            raise CubeValidationError("Центральные стикеры должны задавать порядок U R F D L B.")

    def validate_physical(self) -> None:
        """Reject colourings that cannot be produced by legal cube moves."""
        error = FaceCube(self.facelets).toCubieCube().verify()
        messages = {
            -2: "Невозможная пара цветов у одного или нескольких рёбер. Проверьте стикеры на стыках двух граней.",
            -3: "Одно из рёбер перевёрнуто. Проверьте ориентацию сеток и два стикера этого ребра.",
            -4: "Невозможная тройка цветов у одного или нескольких углов. Проверьте стикеры в углах граней.",
            -5: "Один или несколько углов повернуты невозможно. Проверьте поворот сетки и стикеры в углах.",
            -6: "Невозможная перестановка деталей. Обычно причина — перепутанные цвета или поворот одной из сеток.",
        }
        if error:
            raise CubeValidationError(messages.get(error, "Состояние куба физически невозможно. Проверьте раскраску и ориентацию граней."))

    def is_solved(self) -> bool:
        return self.facelets == "".join(face * 9 for face in FACE_ORDER)

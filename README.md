# CubeSolver

Web application for manually entering a 3×3 Rubik's Cube state on an
interactive 3D model, validating it, and providing an interactive sequence of
moves.

## Development

```powershell
docker compose up --build
```

The frontend is available at `http://localhost:5174` by default; API
documentation is at `http://localhost:8000/docs`. Set `FRONTEND_PORT` to use
another available host port.

The application deliberately has no automatic photo recognition. Start with an
empty 3D cube, colour its six centres as on the physical cube, then fill the
remaining stickers. The app checks counts, piece combinations, orientation and
parity before enabling the solver. A legal random state can be generated for
practice.

## Solver guarantee

The current worker uses the two-phase Kociemba engine and explicitly marks its
answers as non-optimal. A mathematically optimal 0–20-depth engine must be
integrated before claiming God’s-number optimality in production.

## Android companion

The standalone Android version lives in `android-app/`. It is an additional client: the existing
web frontend and FastAPI backend keep their original API-based workflow. The Android client reuses
the shared cube model and 3D renderer, but bundles its own Kociemba worker and persists its session
locally, so solving works in airplane mode.

```powershell
cd android-app
npm install
npm run android:debug
```

Android Studio with SDK 36 is required. The generated project targets API 36 and supports Android
10 (API 29) and newer. See `android-app/README.md` for signing and release instructions.

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

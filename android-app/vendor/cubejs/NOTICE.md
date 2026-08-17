# CubeJS 1.3.2

This directory contains the unmodified runtime files from `cubejs@1.3.2` by Petri Lehtinen and
contributors. The upstream package declares `npm@6` as a runtime dependency even though the cube
runtime does not import it. The local package intentionally omits that unused dependency to keep
the Android production dependency tree small and free of obsolete npm CLI packages.

Upstream: https://github.com/ldez/cubejs
License: MIT (see `LICENSE`)

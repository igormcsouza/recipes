#!/usr/bin/env bash
# Full check: web tests (100% coverage), router tests, static build, infra tests and lint.
set -euo pipefail
cd "$(dirname "$0")/.."
npm test
npm run test:router
npm run build
(cd infra && uv run ruff check . && uv run ruff format --check . && uv run pytest)

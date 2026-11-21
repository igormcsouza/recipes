#!/usr/bin/env bash
# Full check: lint, types, web tests (100% coverage), router tests, static build, dependency audit, infra lint and tests.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run lint
npm run typecheck
npm test
npm run test:router
npm run build
npm audit --audit-level=high
(cd infra && uv run ruff check . && uv run ruff format --check . && uv run pytest)

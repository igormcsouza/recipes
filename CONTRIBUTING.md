# Contributing to Receitas do Igor Souza

## Setup
```bash
git clone https://github.com/igormcsouza/receitas.git && cd receitas
npm ci && (cd infra && uv sync)
```

## Before you open a PR
Run the full check: `./scripts/check.sh`. Say in the PR what you ran and what you could not verify.

## Rules
- Branch: `<type>/<issue>-<kebab>`; PR title is a Conventional Commit: `feat(scope): summary`.
- Breaking change: `feat!:` plus a `BREAKING CHANGE:` footer with the migration.
- Tests and docs in the same PR. Keep the diff small and on one topic.
- Follow `AGENTS.md`; UI and backend conventions come from the house-style standard.

## Releases
Maintainers run `/house-style:release`; see `CHANGELOG.md` for history.

## License
By contributing you agree your work is released under the [MIT license](LICENSE).

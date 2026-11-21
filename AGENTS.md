# Receitas do Igor Souza

Static Next.js 16 recipe blog (PT/EN/FR), exported to S3 + CloudFront by AWS CDK (Python). Follows the house-style standard (accent green, Lucide icon `chef-hat`, config in `.house-style.json`).

## Layout
- `content/recipes/<id>/`: `recipe.json` (shared facts) plus `pt|en|fr.mdx` (text). `lib/recipes.ts` validates it at build time.
- `public/recipes/<id>/`: photos named in `recipe.json`. `card.jpg` is the Open Graph image.
- `app/(root)/`: `/` fallback redirect. `app/[lang]/`: everything else (it is also the root layout, there is no `app/layout.tsx`).
- `lib/i18n.ts`: languages, UI strings, `pickLang`, `switchPath`. `infra/functions/router.js` mirrors `pickLang` for CloudFront.
- `infra/`: CDK stack `RecipesSite` in us-east-1 (bucket, CloudFront, ACM, Route 53, GitHub OIDC role).

## Commands
- Dev: `npm run dev` (port 28860) or `docker compose up --build --wait`
- Test: `npm test` (vitest, 100% on `lib/` and `components/`), `npm run test:router`, `cd infra && uv run pytest`
- Full check (run before every PR): `./scripts/check.sh`
- Audit house-style: `/house-style:audit`

## Conventions
- Branch `<type>/<issue>-<kebab>` (`feat/`, `bug-fix/`, `ci/`). One PR per slice. Squash-merge with a Conventional Commit title and PR number: `feat(scope): summary (#N)`.
- Tests ship in the same PR; coverage bar: 100% for `lib/`, `components/` and `infra/stacks`.
- UI: semantic tokens from `app/house-style.css` (never hex), Lucide icons only, WCAG 2.2 AA, test at 375px. Every UI string lives in `lib/i18n.ts` in all three languages.
- Docs change in the same PR as behavior. Releases via `/house-style:release`.

## Hard stops (ask the user first)
Deploying (`cdk deploy`), changing the domain or OIDC trust, changing ports, force push, deleting data, spending money, publishing a release.

## Gotchas
- Static export: no server code, no `headers()`, no redirects in `next.config`. Language redirect for `/` lives in the CloudFront Function; `RootRedirect` is only the fallback for local dev.
- Server components cannot pass functions to client components (that is why `SiteHeader` passes plain strings, not the dict).
- Lucide has no brand icons, so share buttons are text labels with generic icons.
- Adding a language means: `LANGS` and `dict` in `lib/i18n.ts`, `router.js`, one `.mdx` per recipe.

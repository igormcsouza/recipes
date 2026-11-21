<img src="brand/icon.svg" alt="" width="56" align="left">

# Receitas do Igor Souza

**A public, bilingual-plus recipe blog (PT, EN, FR) that is a fully static Next.js site on S3 and CloudFront.**

[![CI](https://github.com/igormcsouza/receitas/actions/workflows/ci.yml/badge.svg)](https://github.com/igormcsouza/receitas/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/igormcsouza/receitas)](LICENSE)

Live at https://recipes.igormcsouza.com.br

## Why

Recipes as plain files in git, readable on a phone in the kitchen, in the reader's own language and theme. No server, no database, no accounts.

## Quickstart

```bash
cp .env.example .env
docker compose up --build --wait   # http://localhost:28860
```

## Usage

| Command | What it does |
|---|---|
| `docker compose up --build --wait` | Build the static export and serve it with nginx on port 28860 |
| `npm run dev` | Next.js dev server on port 28860 (hot reload) |
| `./scripts/check.sh` | Tests (100% coverage), router tests, build, infra tests and lint |
| `cd infra && uv run cdk deploy` | Create or update the AWS stack (asks for your OK first) |

### Add a recipe

Create `content/recipes/<id>/` with `recipe.json` (time, servings, difficulty), and `pt.mdx`, `en.mdx`, `fr.mdx`. Every language is required: the build fails if one is missing or the ingredient and step counts disagree. Put photos in `public/recipes/<id>/` and name them in `recipe.json` (`hero`, `og`, `stepImages`). Copy `content/recipes/fricasse-missionario/` as a template.

## How it works

- Pages live under `/pt/`, `/en/` and `/fr/` with translated slugs. A CloudFront Function turns `/` into a 302 to the reader's language (cookie `lang`, then `Accept-Language`, else English), so nothing flashes.
- Theme follows the system and can be switched in the settings popup (next-themes, class based).
- Print view is plain CSS: header, hero, share buttons and footer disappear.
- Each page ships hreflang alternates, JSON-LD `Recipe` data, a sitemap and one RSS feed per language.
- Optional analytics: set `GOATCOUNTER` to your GoatCounter code to enable the cookieless counter.
- Push to `main` runs tests, builds, syncs to S3 and invalidates CloudFront through GitHub OIDC (`.github/workflows/deploy.yml`).

## Deploy (first time)

1. `cd infra && uv sync && uv run cdk deploy` (region us-east-1, uses the existing GitHub OIDC provider and the Route 53 zone).
2. In the GitHub repo set the variable `AWS_DEPLOY_ROLE_ARN` to the stack output `DeployRoleArn`, and optionally `GOATCOUNTER`.
3. Push to `main`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Releases: see the changelog in [CHANGELOG.md](CHANGELOG.md).

## License

MIT, see [LICENSE](LICENSE).

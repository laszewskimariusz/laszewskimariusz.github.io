# laszewskimariusz.github.io

Personal site of Mariusz Łaszewski — how I build and run a team of AI agents.

- Live: https://laszewskimariusz.github.io
- Stack: Astro (static), TypeScript, YAML content (`src/data/site.{en,pl}.yaml`)
- Quality: unit tests for the content model, Playwright smoke tests (incl. no-JS and 360 px), link check, gitleaks + forbidden-string guard in CI.

## Run locally
npm ci && npm run dev

## Edit content
Change `src/data/site.en.yaml` and `site.pl.yaml` (same keys). `npm test` fails if they drift apart.

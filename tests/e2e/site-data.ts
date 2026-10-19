// Playwright cannot load Vite `?raw` imports, so e2e tests read the YAML directly.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import type { Lang, Site } from '../../src/lib/content';

export function loadSite(lang: Lang): Site {
  return parse(readFileSync(new URL(`../../src/data/site.${lang}.yaml`, import.meta.url), 'utf8')) as Site;
}

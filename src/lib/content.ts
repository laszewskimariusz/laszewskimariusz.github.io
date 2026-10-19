import { parse } from 'yaml';
import enRaw from '../data/site.en.yaml?raw';
import plRaw from '../data/site.pl.yaml?raw';

export type Lang = 'en' | 'pl';
export interface Link { label: string; href: string }
export interface Service { title: string; body: string; points: string[] }
export interface Agent { id: string; role: string; does: string; model: 'light' | 'strong' }
export interface Step { id: string; label: string; detail: string }
export interface Stat { value: string; label: string }
export interface Project {
  id: string; name: string; summary: string; stack: string[];
  visibility: 'open-source' | 'production' | 'private';
  repo?: string; demo?: string;
}
export interface StackGroup { title: string; items: string[] }
export interface Site {
  meta: { title: string; description: string };
  ui: { switchLabel: string; themeLabel: string; nav: Link[]; badge: Record<Project['visibility'], string>; modelLabel: Record<Agent['model'], string> };
  hero: { name: string; tagline: string; intro: string; links: Link[] };
  services: { eyebrow: string; title: string; items: Service[] };
  team: { eyebrow: string; title: string; intro: string; human: { role: string; does: string }; coordinator: { role: string; does: string }; agents: Agent[]; flowTitle: string; flow: Step[]; principlesTitle: string; principles: string[] };
  stats: { eyebrow: string; title: string; items: Stat[] };
  projects: { eyebrow: string; title: string; items: Project[] };
  stack: { eyebrow: string; title: string; groups: StackGroup[] };
  about: { eyebrow: string; title: string; paragraphs: string[]; location: string };
  footer: { note: string; links: Link[] };
}

const raw: Record<Lang, string> = { en: enRaw, pl: plRaw };

function walk(v: unknown, path: string, out: string[]) {
  if (typeof v === 'string') {
    if (!v.trim()) out.push(`empty string at ${path}`);
    if (/^http:\/\//.test(v)) out.push(`link must be https at ${path}`);
  } else if (Array.isArray(v)) {
    if (v.length === 0) out.push(`empty list at ${path}`);
    v.forEach((x, i) => walk(x, `${path}[${i}]`, out));
  } else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k, out);
  }
}

export function validateSite(s: Site): string[] {
  const errors: string[] = [];
  walk(s, '', errors);
  for (const p of s.projects?.items ?? []) {
    if (p.visibility === 'private' && (p.repo || p.demo)) errors.push(`project ${p.id}: private project must not have a repo/demo link`);
  }
  return errors;
}

export function keyPaths(obj: unknown, prefix = ''): string[] {
  if (Array.isArray(obj)) return [`${prefix}[${obj.length}]`, ...obj.flatMap((x, i) => keyPaths(x, `${prefix}[${i}]`))];
  if (obj && typeof obj === 'object') return Object.keys(obj).sort().flatMap((k) => [`${prefix}.${k}`, ...keyPaths((obj as Record<string, unknown>)[k], `${prefix}.${k}`)]);
  return [];
}

export function parityErrors(base: Site, other: Site): string[] {
  const a = new Set(keyPaths(base)), b = new Set(keyPaths(other));
  return [
    ...[...a].filter((k) => !b.has(k)).map((k) => `missing key ${k.replace(/^\./, '')}`),
    ...[...b].filter((k) => !a.has(k)).map((k) => `extra key ${k.replace(/^\./, '')}`),
  ];
}

const cache = new Map<Lang, Site>();
export function loadSite(lang: Lang): Site {
  const hit = cache.get(lang);
  if (hit) return hit;
  const site = parse(raw[lang]) as Site;
  const errors = validateSite(site);
  if (lang !== 'en') errors.push(...parityErrors(parse(raw.en) as Site, site));
  if (errors.length) throw new Error(`site.${lang}.yaml invalid:\n${errors.join('\n')}`);
  cache.set(lang, site);
  return site;
}

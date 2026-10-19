import { describe, it, expect } from 'vitest';
import { loadSite, validateSite, keyPaths, parityErrors, type Site } from '../../src/lib/content';

describe('content', () => {
  it('loads and validates EN and PL', () => {
    expect(() => loadSite('en')).not.toThrow();
    expect(() => loadSite('pl')).not.toThrow();
  });

  it('PL has exactly the same structure as EN', () => {
    expect(keyPaths(loadSite('pl'))).toEqual(keyPaths(loadSite('en')));
  });

  it('rejects a private project with a repo or demo link', () => {
    const s: Site = structuredClone(loadSite('en'));
    const p = s.projects.items.find((x) => x.visibility === 'private')!;
    p.repo = 'https://github.com/x/y';
    expect(validateSite(s).join()).toMatch(/private.*link/i);
  });

  it('rejects empty strings anywhere', () => {
    const s: Site = structuredClone(loadSite('en'));
    s.hero.tagline = '';
    expect(validateSite(s).join()).toMatch(/hero\.tagline/);
  });

  it('rejects non-https external links', () => {
    const s: Site = structuredClone(loadSite('en'));
    s.hero.links[0].href = 'http://example.com';
    expect(validateSite(s).join()).toMatch(/https/);
  });

  it('agent ids and project ids are unique', () => {
    const s = loadSite('en');
    const a = s.team.agents.map((x) => x.id), p = s.projects.items.map((x) => x.id);
    expect(new Set(a).size).toBe(a.length);
    expect(new Set(p).size).toBe(p.length);
  });

  it('parityErrors reports a key missing from PL (build must fail, not render empty)', () => {
    const pl: Site = structuredClone(loadSite('pl'));
    delete (pl.about as Partial<Site['about']>).location;
    expect(parityErrors(loadSite('en'), pl).join()).toMatch(/about\.location/);
  });

  it('parityErrors is empty for the shipped EN/PL files', () => {
    expect(parityErrors(loadSite('en'), loadSite('pl'))).toEqual([]);
  });
});

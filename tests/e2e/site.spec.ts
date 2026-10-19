import { test, expect } from '@playwright/test';
import { loadSite } from './site-data';

for (const [path, lang] of [['/', 'en'], ['/pl/', 'pl']] as const) {
  test(`${lang}: loads with correct lang and name`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.getByRole('banner')).toContainText('Mariusz Łaszewski');
  });

  test(`${lang}: language switch links to the other language`, async ({ page }) => {
    await page.goto(path);
    const other = lang === 'en' ? '/pl/' : '/';
    await expect(page.getByTestId('lang-switch')).toHaveAttribute('href', other);
  });
}

test('theme toggle flips data-theme', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  await page.getByTestId('theme-toggle').click();
  await expect(html).not.toHaveAttribute('data-theme', before ?? '');
});

for (const [path, lang] of [['/', 'en'], ['/pl/', 'pl']] as const) {
  const s = loadSite(lang);

  test(`${lang}: static sections render copy from YAML`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(s.hero.tagline);
    await expect(page.locator('#what')).toContainText(s.services.items[0].title);
    for (const st of s.stats.items) await expect(page.locator('#numbers')).toContainText(st.value);
    await expect(page.locator('#stack')).toContainText(s.stack.groups[0].items[0]);
    await expect(page.locator('#about')).toContainText(s.about.location);
    await expect(page.locator('body')).not.toContainText('undefined');
  });

  test(`${lang}: no horizontal overflow at 360px`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('team: every agent and flow step is listed', async ({ page }) => {
  const s = loadSite('en');
  await page.goto('/');
  const team = page.locator('#team');
  for (const a of s.team.agents) await expect(team.locator(`[data-agent="${a.id}"]`)).toContainText(a.role);
  for (const f of s.team.flow) await expect(team).toContainText(f.label);
  for (const p of s.team.principles) await expect(team).toContainText(p);
});

test('team: selecting an agent shows its role and model class', async ({ page }) => {
  const s = loadSite('en');
  const a = s.team.agents.find((x) => x.model === 'light')!;
  await page.goto('/');
  await page.locator(`[data-agent="${a.id}"]`).click();
  const d = page.getByTestId('agent-detail');
  await expect(d).toContainText(a.does);
  await expect(d).toContainText(s.ui.modelLabel.light);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('team content is fully readable', async ({ page }) => {
    const s = loadSite('en');
    await page.goto('/');
    for (const a of s.team.agents) await expect(page.locator('#team')).toContainText(a.does);
  });
});

test('projects: all cards, correct badges, links only for public', async ({ page }) => {
  const s = loadSite('en');
  await page.goto('/');
  for (const p of s.projects.items) {
    const card = page.locator(`#built [data-project="${p.id}"]`);
    await expect(card).toContainText(p.name);
    await expect(card.locator('.badge')).toHaveText(s.ui.badge[p.visibility]);
    const links = card.locator('a');
    if (p.visibility === 'private') await expect(links).toHaveCount(0);
    if (p.repo) await expect(card.locator(`a[href="${p.repo}"]`)).toHaveCount(1);
  }
});

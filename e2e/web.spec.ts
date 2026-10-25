import { expect, test, type Page } from '@playwright/test';

async function openSection(page: Page, key = '1') {
  await page.goto(`/read/cfrn-1999/s/${key}`);
  await expect(page.locator('#provision-column')).toBeVisible();
}

test('a shared section URL renders that section', async ({ page }) => {
  await openSection(page);
  await expect(
    page.getByRole('heading', { name: 'Supremacy of the Constitution' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Nigeria Constitution and Law' }),
  ).toHaveCount(0);
  expect(page.url()).toContain('/read/cfrn-1999/s/1');
});

test('refresh keeps the section and a bad id offers the Library', async ({
  page,
}) => {
  await openSection(page);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Supremacy of the Constitution' }),
  ).toBeVisible();
  await page.goto('/read/not-a-law/s/1');
  await expect(
    page.getByText('This instrument is not in the loaded text.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Library' }).first().click();
  await expect(
    page.getByRole('heading', { name: 'Nigeria Constitution and Law' }),
  ).toBeVisible();
});

test('arrow keys move to the next section unless a field is focused', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openSection(page);
  await page
    .getByRole('heading', { name: 'Supremacy of the Constitution' })
    .click();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/\/read\/cfrn-1999\/s\/2$/);
  await expect(
    page.getByRole('heading', { name: 'The Federal Republic of Nigeria' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ask about this section' }).click();
  await page.getByRole('textbox', { name: 'Ask about this section' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/\/read\/cfrn-1999\/s\/2$/);
});

test('the provision column stays within 68 characters', async ({ page }) => {
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await openSection(page);
    const column = page.locator('#provision-column');
    const measured = await column.evaluate((element) => {
      const probe = document.createElement('div');
      probe.style.font = getComputedStyle(element).font;
      probe.style.width = '68ch';
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      element.appendChild(probe);
      const limit = probe.getBoundingClientRect().width;
      probe.remove();
      const box = element.getBoundingClientRect();
      return {
        width: box.width,
        limit,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        headerMoves: element.querySelectorAll('[role="button"]').length,
      };
    });
    expect(measured.width).toBeLessThanOrEqual(measured.limit + 1);
    expect(measured.scrollWidth).toBeLessThanOrEqual(measured.clientWidth + 1);
    if (width === 1280) {
      expect(measured.width).toBeGreaterThan(measured.limit - 2);
      expect(measured.headerMoves).toBeGreaterThan(0);
    }
    if (width === 390) {
      expect(measured.headerMoves).toBe(0);
    }
  }
});

test('launch has no account wall', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Nigeria Constitution and Law' }),
  ).toBeVisible();
  await expect(page.getByText('Sign in', { exact: false })).toHaveCount(0);
});

test('search opens from the keyboard and from a search URL', async ({
  page,
}) => {
  await page.goto('/');
  const field = page.getByRole('textbox', {
    name: 'Search the Constitution and laws',
  });
  await field.click();
  await field.fill('supremacy');
  const hit = page.getByRole('button', {
    name: /Supremacy of the Constitution/,
  });
  await expect(hit.first()).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Supremacy of the Constitution' }),
  ).toBeVisible();

  await page.goto('/?q=supremacy');
  await expect(hit.first()).toBeVisible();
  expect(page.url()).toContain('q=supremacy');
});

test('a note can be created and edited', async ({ page }) => {
  await openSection(page);
  await page.getByRole('button', { name: 'Note on this section' }).click();
  await page.getByRole('textbox', { name: 'Note' }).fill('Pilot note');
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(
    page.getByRole('button', { name: 'Note on this section, saved' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  if ((await page.getByRole('tab', { name: 'Notes' }).count()) === 0) {
    await page.getByRole('button', { name: 'Close' }).click();
  }
  await page.getByRole('tab', { name: 'Notes' }).click();
  await page.getByRole('button', { name: 'Pilot note' }).click();
  await page.getByRole('textbox', { name: 'Note' }).fill('Pilot note revised');
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(
    page.getByRole('button', { name: 'Pilot note revised' }),
  ).toBeVisible();
});

test('a scenario citation opens the reader', async ({ page }) => {
  await page.goto('/scenario');
  await expect(page.getByRole('heading', { name: 'Scenario' })).toBeVisible();
  const continueButton = page.getByRole('button', { name: 'Continue' });
  if (await continueButton.count()) {
    await continueButton.click();
  }
  await page
    .getByRole('textbox', { name: 'Describe what happened, in your own words' })
    .fill('The court denied a fair hearing');
  await page.getByRole('button', { name: 'Explain' }).click();
  await page.getByRole('button', { name: 'Open' }).click();
  await expect(
    page.getByRole('heading', { name: 'Right to fair hearing' }),
  ).toBeVisible();
});

test('the own-key warning is visible in the browser', async ({ page }) => {
  await page.goto('/settings/ai');
  await expect(
    page.getByText('A browser protects this key less than a phone.'),
  ).toBeVisible();
});

test('focus outlines are visible', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Nigeria Constitution and Law' }),
  ).toBeVisible();
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => {
    const active = document.activeElement;
    return active ? getComputedStyle(active).outlineStyle : 'none';
  });
  expect(outline).not.toBe('none');
});

test('library, scenario, and notes stay on the page at a phone and a desk width', async ({
  page,
}) => {
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ['/', '/scenario', '/notes']) {
      await page.goto(path);
      const scroll = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scroll.scrollWidth).toBeLessThanOrEqual(scroll.clientWidth + 1);
    }
  }
});

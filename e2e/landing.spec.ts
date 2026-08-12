import { expect, test } from '@playwright/test';
import { nodeByText } from './helpers';

test('landing page renders the MonoMap hero', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { level: 1 })).toContainText('One tool');
	await expect(page.getByRole('link', { name: /Start mapping/ }).first()).toBeVisible();
	await expect(page.getByText('No sign-up').first()).toBeVisible();

	// Ethos + features sections
	await expect(page.getByRole('heading', { name: 'It stays small on purpose.' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Infinite canvas' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Live Markdown split view' })).toBeVisible();
});

test('CTA links open the app', async ({ page }) => {
	await page.goto('/');

	const start = page.getByRole('link', { name: /Start mapping/ }).first();
	await expect(start).toHaveAttribute('href', '/workspace');

	await start.click();
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
});

test('footer links to privacy, terms, Tehnika and email', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
	await expect(page.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms');
	await expect(page.getByRole('link', { name: /A product by Tehnika/ })).toHaveAttribute(
		'href',
		'https://www.tehnika.mk'
	);
	await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
		'href',
		'https://github.com/tehnika-mk/monomap'
	);
	await expect(page.getByRole('link', { name: 'hello@tehnika.mk' })).toHaveAttribute(
		'href',
		'mailto:hello@tehnika.mk'
	);
});

test('privacy and terms pages render', async ({ page }) => {
	await page.goto('/privacy');
	await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'hello@tehnika.mk' })).toBeVisible();

	await page.goto('/terms');
	await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
});

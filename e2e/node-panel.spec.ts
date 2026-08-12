import { expect, test, type Page } from '@playwright/test';
import { nodeByText } from './helpers';

async function openMap(page: Page) {
	await page.goto('/workspace');
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
}

test('node panel opens on selection and color presets apply/reset', async ({ page }) => {
	await openMap(page);
	await nodeByText(page, 'Central idea').click();

	const panel = page.getByRole('complementary', { name: 'Node settings' });
	await expect(panel).toBeVisible();

	await page.getByRole('button', { name: 'Pastel Red' }).click();
	let color = await page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode.style.color);
	expect(color).toBe('#ef4444');

	await page.getByRole('button', { name: 'Default' }).click();
	const after = await page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode.style);
	expect(after?.color).toBeUndefined();
});

test('emoji picker adds and removes a node icon', async ({ page }) => {
	await openMap(page);
	await nodeByText(page, 'Central idea').click();

	await page.getByRole('button', { name: 'Add / change emoji' }).click();
	await page.getByPlaceholder(/Search emojis/).fill('rocket');
	await page.getByRole('button', { name: 'rocket' }).click();

	const icon = await page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode.style.icon);
	expect(icon).toBe('🚀');
	await expect(page.locator('.node-icon')).toHaveText('🚀');

	await page.getByRole('button', { name: 'Remove icon' }).click();
	const after = await page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode.style);
	expect(after?.icon).toBeUndefined();
});

test('hyperlinks can be added, shown as a badge, and removed', async ({ page }) => {
	await openMap(page);
	await nodeByText(page, 'Central idea').click();

	await page.getByPlaceholder('https://example.com').fill('https://svelte.dev');
	await page.getByRole('button', { name: 'Add', exact: true }).click();

	const links = await page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode.links);
	expect(links).toEqual(['https://svelte.dev']);
	await expect(page.getByRole('link', { name: 'External link' })).toBeVisible();

	await page.getByRole('button', { name: 'Remove link' }).click();
	const after = await page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode.links);
	expect(after).toBeUndefined();
});

test('links get https:// automatically when added without a protocol', async ({ page }) => {
	await openMap(page);
	await nodeByText(page, 'Central idea').click();

	await page.getByPlaceholder('https://example.com').fill('svelte.dev');
	await page.getByRole('button', { name: 'Add', exact: true }).click();

	const links = await page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode.links);
	expect(links).toEqual(['https://svelte.dev']);
	await expect(page.getByRole('link', { name: 'External link' })).toBeVisible();
});

test('notes are plain text and show a node note badge', async ({ page }) => {
	await openMap(page);
	await nodeByText(page, 'Central idea').click();

	const textarea = page.getByPlaceholder(/Write notes/);
	await expect(textarea).toBeVisible();

	await textarea.fill('Just some plain notes\nsecond line');

	const notes = await page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode.notes);
	expect(notes).toBe('Just some plain notes\nsecond line');

	// the node now shows a note badge
	await expect(page.locator('[data-node] .node-note')).toHaveText('📝');
});

test('shift+enter creates multiline nodes', async ({ page }) => {
	await openMap(page);

	await page.keyboard.press('Tab'); // create an empty child, which becomes selected
	await page.keyboard.press('Space');
	await page.waitForTimeout(50);
	await page.keyboard.type('line one');
	await page.keyboard.press('Shift+Enter');
	await page.keyboard.type('line two');
	await page.keyboard.press('Enter');

	const text = await page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode.children[2].text);
	expect(text).toBe('line one\nline two');
});

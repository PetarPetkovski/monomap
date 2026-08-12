import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { nodeByText } from './helpers';

async function openMap(page: Page) {
	await page.goto('/workspace');
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
}

test('exports a map as a markdown outline', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const child = w.createChild(w.maps[0].rootNode.id, 'Child');
		w.createChild(child!.id, 'Grandchild');
	});

	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Actions for Your First Map', exact: true }).click();
	await page.getByRole('button', { name: 'Export .md', exact: true }).click();
	const download = await downloadPromise;

	expect(download.suggestedFilename()).toBe('Your First Map.md');
	const path = await download.path();
	expect(readFileSync(path!, 'utf8')).toBe(
		'# Central idea\n- Node 1\n- Node 2\n- Child\n  - Grandchild\n'
	);
});

test('imports a markdown file into a new auto-sorted map', async ({ page }) => {
	await openMap(page);

	await page.setInputFiles('input[data-testid="import-markdown"]', {
		name: 'Ideas.md',
		mimeType: 'text/markdown',
		buffer: Buffer.from('# Ideas\n- One\n  - Detail\n- Two\n')
	});

	await page.waitForFunction(() => window.__mindmap!.workspace.maps.some((m) => m.title === 'Ideas'));
	const map = await page.evaluate(
		() => window.__mindmap!.workspace.maps.find((m) => m.title === 'Ideas')!
	);
	expect(map.rootNode.text).toBe('Ideas');
	expect(map.rootNode.children.map((c) => c.text)).toEqual(['One', 'Two']);
	expect(map.rootNode.children[0].children[0].text).toBe('Detail');
	await expect(nodeByText(page, 'Ideas')).toBeVisible();
});

test('importing a markdown file auto-sorts children alphabetically', async ({ page }) => {
	await openMap(page);

	await page.setInputFiles('input[data-testid="import-markdown"]', {
		name: 'Sort.md',
		mimeType: 'text/markdown',
		buffer: Buffer.from('# Root\n- banana\n- Apple\n- cherry\n')
	});

	await page.waitForFunction(() => window.__mindmap!.workspace.maps.some((m) => m.title === 'Sort'));
	const map = await page.evaluate(
		() => window.__mindmap!.workspace.maps.find((m) => m.title === 'Sort')!
	);
	expect(map.rootNode.children.map((c) => c.text)).toEqual(['Apple', 'banana', 'cherry']);
});

test('imports plain text as sibling nodes', async ({ page }) => {
	await openMap(page);

	await page.setInputFiles('input[data-testid="import-markdown"]', {
		name: 'notes.txt',
		mimeType: 'text/plain',
		buffer: Buffer.from('first\nsecond\nthird')
	});

	await page.waitForFunction(() => window.__mindmap!.workspace.maps.some((m) => m.title === 'notes'));
	const map = await page.evaluate(
		() => window.__mindmap!.workspace.maps.find((m) => m.title === 'notes')!
	);
	expect(map.rootNode.text).toBe('Imported');
	expect(map.rootNode.children.map((c) => c.text)).toEqual(['first', 'second', 'third']);
});

test('exports the map canvas as a png', async ({ page }) => {
	await openMap(page);

	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Actions for Your First Map', exact: true }).click();
	await page.getByRole('button', { name: 'Export PNG', exact: true }).click();
	const download = await downloadPromise;

	expect(download.suggestedFilename()).toBe('Your First Map.png');
	const path = await download.path();
	const buffer = readFileSync(path!);
	expect(buffer.length).toBeGreaterThan(1000);
});

test('saves a profile and imports it back to restore the workspace', async ({ page }) => {
	await openMap(page);
	page.on('dialog', (dialog) => dialog.accept());

	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Save profile' }).click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toBe('mindmap-profile.json');
	const profilePath = await download.path();
	const profile = JSON.parse(readFileSync(profilePath!, 'utf8'));
	expect(profile.app).toBe('mindmap');
	expect(profile.workspace.maps[0].rootNode.text).toBe('Central idea');

	// mutate the live workspace, then restore it from the profile file
	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		w.renameMap(w.maps[0].id, 'Changed');
	});
	await page.setInputFiles('input[data-testid="import-profile"]', {
		name: 'mindmap-profile.json',
		mimeType: 'application/json',
		buffer: readFileSync(profilePath!)
	});

	await page.waitForFunction(() => window.__mindmap!.workspace.maps[0].title === 'Your First Map');
});

import { expect, test, type Page } from '@playwright/test';
import { nodeByText } from './helpers';

async function openMap(page: Page) {
	await page.goto('/workspace');
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
}

test('sidebar is open by default and toggles with Ctrl+\\ and the handle', async ({ page }) => {
	await openMap(page);

	const sidebar = page.getByRole('complementary', { name: 'Maps sidebar' });
	await expect(sidebar).toBeVisible();

	await page.keyboard.press('Control+\\');
	await expect(sidebar).not.toBeVisible();

	await page.getByRole('button', { name: 'Toggle sidebar' }).click();
	await expect(sidebar).toBeVisible();
});

test('double-click renames a map inline', async ({ page }) => {
	await openMap(page);

	await page.getByText('Your First Map', { exact: true }).dblclick();
	const input = page.locator('input.rename-input');
	await expect(input).toBeVisible();
	await input.fill('Renamed');
	await input.press('Enter');

	expect(await page.evaluate(() => window.__mindmap!.workspace.maps[0].title)).toBe('Renamed');
});

test('clicking outside closes the actions menu', async ({ page }) => {
	await openMap(page);

	await page.getByRole('button', { name: 'Actions for Your First Map', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Rename', exact: true })).toBeVisible();

	await page.mouse.click(640, 500);
	await expect(page.getByRole('button', { name: 'Rename', exact: true })).not.toBeVisible();
});

test('tab bar appears with multiple maps, switches and closes', async ({ page }) => {
	await openMap(page);

	const tablist = page.getByRole('tablist');
	await expect(tablist).not.toBeVisible();

	await page.keyboard.press('Control+t');
	await expect(tablist).toBeVisible();
	await expect(page.getByRole('tab')).toHaveCount(2);

	const firstTitle = await page.evaluate(() => window.__mindmap!.workspace.maps[0].title);
	await page.getByRole('tab').nth(0).click();
	let active = await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		return w.maps.find((m) => m.id === w.activeTabId)?.title;
	});
	expect(active).toBe(firstTitle);

	await page.getByRole('tab').nth(1).getByRole('button', { name: 'Close tab' }).click();
	await expect(tablist).not.toBeVisible();
});

test('folders organize maps via drag and drop', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => window.__mindmap!.workspace.createMap('Project A'));

	// Folder creation is currently hidden from the UI, so seed it via the store.
	await page.evaluate(() => window.__mindmap!.workspace.createFolder('Work'));
	await expect(page.getByText('Work', { exact: true })).toBeVisible();

	const sidebar = page.getByRole('complementary', { name: 'Maps sidebar' });
	await sidebar.getByText('Project A').hover();

	await page.evaluate(() => {
		const findLabel = (selector: string, text: string) =>
			[...document.querySelectorAll<HTMLElement>(`${selector} .label`)].find(
				(el) => el.textContent === text
			)!;
		const source = findLabel('.map-row', 'Project A');
		const target = findLabel('.folder-head', 'Work');
		const dt = new DataTransfer();
		source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
		target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
		target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
		source.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
	});

	const folderId = await page.evaluate(
		() => window.__mindmap!.workspace.maps.find((m) => m.title === 'Project A')?.folderId
	);
	expect(folderId).not.toBeNull();
});

test('map actions rename, duplicate and delete', async ({ page }) => {
	await openMap(page);

	await page.getByRole('button', { name: 'Actions for Your First Map', exact: true }).click();
	await page.getByRole('button', { name: 'Rename', exact: true }).click();
	const renameInput = page.locator('input.rename-input');
	await renameInput.fill('Renamed Map');
	await renameInput.press('Enter');
	expect(await page.evaluate(() => window.__mindmap!.workspace.maps[0].title)).toBe('Renamed Map');

	await page.getByRole('button', { name: 'Actions for Renamed Map', exact: true }).click();
	await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
	expect(await page.evaluate(() => window.__mindmap!.workspace.maps.length)).toBe(2);

	const dupTitle = await page.evaluate(() => window.__mindmap!.workspace.maps[1].title);
	await page.getByRole('button', { name: `Actions for ${dupTitle}`, exact: true }).click();
	await page.getByRole('button', { name: 'Delete', exact: true }).click();
	expect(await page.evaluate(() => window.__mindmap!.workspace.maps.length)).toBe(1);
});

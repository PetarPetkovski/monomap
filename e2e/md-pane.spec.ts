import { expect, test, type Page } from '@playwright/test';
import { nodeByText } from './helpers';

async function openMap(page: Page) {
	await page.goto('/workspace');
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
}

async function openPane(page: Page) {
	await page.getByRole('button', { name: 'MD Editor' }).click();
	return page.getByRole('complementary', { name: 'Markdown editor' });
}

test('split .md pane toggles from the sidebar and shows the active outline', async ({ page }) => {
	await openMap(page);

	const pane = page.getByRole('complementary', { name: 'Markdown editor' });
	await expect(pane).not.toBeVisible();

	const ta = (await openPane(page)).getByRole('textbox', { name: 'Markdown outline' });
	await expect(ta).toHaveValue('# Central idea\n- Node 1\n- Node 2');

	await page.getByRole('button', { name: 'MD Editor' }).click();
	await expect(pane).not.toBeVisible();
});

test('typing markdown creates nodes on the canvas', async ({ page }) => {
	await openMap(page);
	const ta = (await openPane(page)).getByRole('textbox', { name: 'Markdown outline' });

	await ta.fill('# Central idea\n- First child\n  - Grandchild');

	await page.waitForFunction(() => {
		const root = window.__mindmap!.workspace.maps[0].rootNode;
		return root.children.length === 1 && root.children[0].children.length === 1;
	});
	const root = await page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode);
	expect(root.children[0].text).toBe('First child');
	expect(root.children[0].children[0].text).toBe('Grandchild');
	await expect(nodeByText(page, 'First child')).toBeVisible();
});

test('canvas edits reflect into the markdown when the pane is not focused', async ({ page }) => {
	await openMap(page);
	const ta = (await openPane(page)).getByRole('textbox', { name: 'Markdown outline' });

	// Blur the sidebar toggle so Tab lands on the canvas and creates a child.
	await page.evaluate(() => {
		(document.activeElement as HTMLElement | null)?.blur();
		window.__mindmap!.canvas.selectNode(window.__mindmap!.workspace.maps[0].rootNode.id);
	});
	await page.keyboard.press('Tab');
	await page.waitForFunction(() => window.__mindmap!.workspace.maps[0].rootNode.children.length === 3);
	await expect(ta).toHaveValue('# Central idea\n- Node 1\n- Node 2\n- ');
});

test('typing in the pane does not clobber the caret or value', async ({ page }) => {
	await openMap(page);
	const ta = (await openPane(page)).getByRole('textbox', { name: 'Markdown outline' });

	await ta.focus();
	await page.keyboard.press('End');
	await page.keyboard.type('xyz');

	expect(await ta.inputValue()).toBe('# Central idea\n- Node 1\n- Node 2xyz');
});

test('Ctrl+M toggles the markdown pane', async ({ page }) => {
	await openMap(page);
	const pane = page.getByRole('complementary', { name: 'Markdown editor' });

	await page.keyboard.press('Control+m');
	await expect(pane).toBeVisible();
	await page.keyboard.press('Control+m');
	await expect(pane).not.toBeVisible();
});

test('sidebar and md pane headers align in height', async ({ page }) => {
	await openMap(page);
	await page.getByRole('button', { name: 'MD Editor' }).click();

	const sidebarHeader = page.getByRole('complementary', { name: 'Maps sidebar' }).locator('header');
	const paneHeader = page.getByRole('complementary', { name: 'Markdown editor' }).locator('header');

	const sh = await sidebarHeader.boundingBox();
	const ph = await paneHeader.boundingBox();
	expect(sh!.height).toBeCloseTo(ph!.height, 0);
	expect(ph!.y).toBeCloseTo(sh!.y, 0);
});

test('markdown pane follows the active map tab', async ({ page }) => {
	await openMap(page);
	const ta = (await openPane(page)).getByRole('textbox', { name: 'Markdown outline' });

	await page.keyboard.press('Control+t'); // new map becomes active
	await expect(ta).toHaveValue('# Central idea');

	await ta.focus();
	await ta.fill('# Second Root');
	await page.waitForFunction(() => window.__mindmap!.workspace.maps[1].rootNode.text === 'Second Root');

	await page.getByRole('tab').nth(0).click();
	await expect(ta).toHaveValue('# Central idea\n- Node 1\n- Node 2');
	await page.getByRole('tab').nth(1).click();
	await expect(ta).toHaveValue('# Second Root');
});

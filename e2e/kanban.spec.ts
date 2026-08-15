import { expect, test, type Page } from '@playwright/test';
import { nodeByText } from './helpers';

async function openMap(page: Page) {
	await page.goto('/workspace');
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
}

test('switches between mind map and kanban workspaces', async ({ page }) => {
	await openMap(page);

	await page.locator('.switch button', { hasText: 'Kanban' }).click();
	await expect(page.getByText('No board open')).toBeVisible();

	await page.keyboard.press('Control+k');
	await expect(nodeByText(page, 'Central idea')).toBeVisible();

	await page.keyboard.press('Control+k');
	await expect(page.getByText('No board open')).toBeVisible();
});

test('creates a board, columns and cards from the UI', async ({ page }) => {
	await openMap(page);

	await page.locator('.switch button', { hasText: 'Kanban' }).click();
	await page.getByText('New board').click();
	await expect(page.locator('.board-title')).toHaveText('Untitled Board');

	await page.locator('.add-col').click();
	await expect(page.locator('.col')).toHaveCount(2);

	const col2 = page.locator('.col').nth(1);
	await col2.locator('.col-title').dblclick();
	const titleInput = col2.locator('.head-input');
	await titleInput.fill('Doing');
	await titleInput.press('Enter');
	await expect(col2.locator('.col-title')).toHaveText('Doing');

	await col2.locator('.add-card').click();
	const cardInput = col2.locator('.card-input');
	await expect(cardInput).toBeVisible();
	await cardInput.fill('Ship it');
	await cardInput.press('Enter');
	await expect(page.locator('[data-card]').filter({ hasText: 'Ship it' })).toBeVisible();
});

test('double-clicking a card renames it inline', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const b = w.createBoard('Flow');
		w.createCard(b.id, b.columns[0].id, 'Rename me');
	});
	await expect(page.locator('[data-card]')).toHaveCount(1);

	await page.locator('[data-card]').dblclick();
	const input = page.locator('input.rename-input');
	await expect(input).toBeVisible();
	await input.fill('Renamed card');
	await input.press('Enter');
	await expect(page.locator('[data-card] .title')).toHaveText('Renamed card');
});

test('moves cards between columns with drag and drop', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const b = w.createBoard('Flow');
		w.renameColumn(b.id, b.columns[0].id, 'Todo');
		w.addColumn(b.id, 'Done');
		w.createCard(b.id, b.columns[0].id, 'Card A');
		w.createCard(b.id, b.columns[0].id, 'Card B');
	});
	await expect(page.locator('.col')).toHaveCount(2);
	await expect(page.locator('[data-card]')).toHaveCount(2);

	// Drag Card A into the Done column.
	const source = page.locator('[data-card]').filter({ hasText: 'Card A' });
	const done = page.locator('.col').nth(1);
	const sb = await source.boundingBox();
	const db = await done.boundingBox();
	await page.mouse.move(sb!.x + sb!.width / 2, sb!.y + sb!.height / 2);
	await page.mouse.down();
	await page.mouse.move(db!.x + 40, db!.y + 40, { steps: 10 });
	await page.mouse.up();

	await expect
		.poll(() =>
			page.evaluate(() => window.__mindmap!.workspace.getActiveBoard()!.columns[1].cards.map((c) => c.title))
		)
		.toEqual(['Card A']);
});

test('filters cards by keyword and label color', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const b = w.createBoard('Search');
		w.createCard(b.id, b.columns[0].id, 'Fix the login bug');
		const staged = w.createCard(b.id, b.columns[0].id, 'Deploy to staging');
		w.addCardLabel(b.id, staged.id, { text: 'bug', color: '#ef4444' });
	});
	await expect(page.locator('[data-card]')).toHaveCount(2);

	const filter = page.locator('input[aria-label="Filter cards"]');
	await filter.fill('login');
	await expect(page.locator('[data-card]:visible')).toHaveCount(1);

	await filter.fill('ef4444');
	await expect(page.locator('[data-card]:visible')).toHaveCount(1);

	await filter.fill('zzz');
	await expect(page.locator('[data-card]:visible')).toHaveCount(0);

	await page.getByRole('button', { name: 'Clear filter' }).click();
	await expect(page.locator('[data-card]:visible')).toHaveCount(2);
});

test('sends a mind map node to a kanban board and navigates back', async ({ page }) => {
	await openMap(page);

	await nodeByText(page, 'Central idea').click();
	const panel = page.getByRole('complementary', { name: 'Node settings' });
	await expect(panel).toBeVisible();

	await panel.getByRole('button', { name: 'Send to Kanban Board' }).click();
	await expect(page.locator('.board-title')).toHaveText('Your First Map Board');
	const editor = page.getByRole('complementary', { name: 'Card editor' });
	await expect(editor).toBeVisible();
	await expect(editor.locator('.title-input')).toHaveValue('Central idea');
	await expect(editor.locator('.check-row')).toHaveCount(2);

	// Jump back to the source node from the card face.
	await editor.locator('.close').click();
	await page.locator('.map-link').click();
	await expect(nodeByText(page, 'Central idea')).toBeVisible();
	await expect(panel).toBeVisible();
	await expect(panel.getByRole('button', { name: 'Open on Board ↗' })).toBeVisible();
});

test('map link centers the mind map on the linked node even when starting hidden', async ({ page }) => {
	await openMap(page);

	// Link the root node to a card and switch to the kanban workspace.
	await nodeByText(page, 'Central idea').click();
	const panel = page.getByRole('complementary', { name: 'Node settings' });
	await expect(panel).toBeVisible();
	await panel.getByRole('button', { name: 'Send to Kanban Board' }).click();
	await expect(page.locator('.board-title')).toHaveText('Your First Map Board');
	await page.getByRole('button', { name: 'Close card editor' }).click();

	// Simulate a stale zero-size viewport (as when the mind map canvas starts
	// hidden) and then jump back via the card's map link.
	await page.evaluate(() => {
		const c = window.__mindmap!.canvas;
		c.viewport = { width: 0, height: 0 };
		c.x = -500;
		c.y = -500;
		c.pendingCenterId = null;
	});
	await page.locator('.map-link').click();
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
	await page.waitForFunction(() => {
		const c = window.__mindmap!.canvas;
		return c.viewport.width > 0 && c.viewport.height > 0 && c.pendingCenterId === null && c.zoom === 1;
	});
	const state = await page.evaluate(() => {
		const c = window.__mindmap!.canvas;
		return { x: c.x, y: c.y, viewport: c.viewport };
	});
	expect(state.x).toBeCloseTo(state.viewport.width / 2, 0);
	expect(state.y).toBeCloseTo(state.viewport.height / 2, 0);
});

test('generates a board from a mind map branch', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const map = w.getActiveMap()!;
		w.createChild(map.rootNode.children[0].id, 'Sub A');
	});

	await nodeByText(page, 'Central idea').click();
	const panel = page.getByRole('complementary', { name: 'Node settings' });
	await expect(panel).toBeVisible();

	await panel.getByRole('button', { name: 'Generate Board from Branch' }).click();
	await expect(page.locator('.board-title')).toHaveText('Central idea');
	await expect(page.locator('.col')).toHaveCount(2);
	await expect(page.locator('[data-card]').filter({ hasText: 'Sub A' })).toBeVisible();
});

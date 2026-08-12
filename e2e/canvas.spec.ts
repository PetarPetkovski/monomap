import { expect, test, type Page } from '@playwright/test';
import { nodeByText } from './helpers';

async function openMap(page: Page) {
	await page.goto('/workspace');
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
}

function rootNode(page: Page) {
	return page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode);
}

function canvasState(page: Page) {
	return page.evaluate(() => {
		const c = window.__mindmap!.canvas;
		return { x: c.x, y: c.y, zoom: c.zoom, selected: c.selectedNodeId, editing: c.editingNodeId };
	});
}

test('keyboard: Tab creates a child, Enter creates a sibling', async ({ page }) => {
	await openMap(page);

	await page.keyboard.press('Tab');
	await page.waitForFunction(() => window.__mindmap!.workspace.maps[0].rootNode.children.length === 3);

	await page.keyboard.press('Space');
	await page.waitForTimeout(50);
	await page.keyboard.type('Child One');
	await page.keyboard.press('Enter');

	await page.waitForFunction(() => window.__mindmap!.workspace.maps[0].rootNode.children.length === 4);
	const root = await rootNode(page);
	expect(root.children[2].text).toBe('Child One');
	expect(root.children[3].text).toBe('');

	// Enter selected the new sibling
	const state = await canvasState(page);
	expect(state.selected).toBe(root.children[3].id);
});

test('keyboard: arrows navigate and Delete removes nodes', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const rootId = w.maps[0].rootNode.id;
		w.createChild(rootId, 'Child');
		w.createChild(rootId, 'Child 2');
	});
	await page.waitForFunction(() => window.__mindmap!.workspace.maps[0].rootNode.children.length === 4);

	const before = await rootNode(page);
	const childId = before.children[0].id;

	await page.evaluate((id) => window.__mindmap!.canvas.selectNode(id), childId);

	// ArrowDown -> second child
	await page.keyboard.press('ArrowDown');
	expect((await canvasState(page)).selected).toBe(before.children[1].id);

	// ArrowLeft -> root
	await page.keyboard.press('ArrowLeft');
	expect((await canvasState(page)).selected).toBe(before.id);

	// ArrowRight -> first child again
	await page.keyboard.press('ArrowRight');
	expect((await canvasState(page)).selected).toBe(childId);

	// Delete removes it and selects root
	await page.keyboard.press('Delete');
	await page.waitForFunction(() => window.__mindmap!.workspace.maps[0].rootNode.children.length === 3);
	expect((await canvasState(page)).selected).toBe(before.id);
});

test('drag moves a node on the canvas', async ({ page }) => {
	await openMap(page);

	const node = nodeByText(page, 'Central idea');
	const box = await node.boundingBox();
	expect(box).not.toBeNull();

	await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
	await page.mouse.down();
	await page.mouse.move(box!.x + box!.width / 2 + 150, box!.y + box!.height / 2 + 90, { steps: 8 });
	await page.mouse.up();

	const root = await rootNode(page);
	expect(root.position.x).toBeGreaterThan(50);
	expect(root.position.y).toBeGreaterThan(40);
});

test('ctrl+wheel zooms in, ctrl+0 recenters', async ({ page }) => {
	await openMap(page);

	await page.mouse.move(400, 300);
	await page.keyboard.down('Control');
	await page.mouse.wheel(0, -240);
	await page.keyboard.up('Control');

	let state = await canvasState(page);
	expect(state.zoom).toBeGreaterThan(1);

	await page.keyboard.press('Control+0');
	state = await canvasState(page);
	expect(state.zoom).toBe(1);
	const viewport = await page.evaluate(() => {
		const c = window.__mindmap!.canvas;
		return { w: c.viewport.width, h: c.viewport.height };
	});
	expect(state.x).toBeCloseTo(viewport.w / 2, 0);
	expect(state.y).toBeCloseTo(viewport.h / 2, 0);
});

test('space+drag pans the canvas', async ({ page }) => {
	await openMap(page);

	const before = await canvasState(page);
	await page.keyboard.down(' ');
	await page.waitForTimeout(300);
	await page.mouse.move(300, 300);
	await page.mouse.down();
	await page.mouse.move(360, 330, { steps: 5 });
	await page.mouse.up();
	await page.keyboard.up(' ');

	const after = await canvasState(page);
	expect(after.x).toBeGreaterThan(before.x + 30);
	expect(after.y).toBeGreaterThan(before.y + 20);
});

test('bezier connection layer renders paths under nodes', async ({ page }) => {
	await openMap(page);

	await page.keyboard.press('Tab');
	await page.waitForFunction(() => window.__mindmap!.workspace.maps[0].rootNode.children.length === 3);

	const pathCount = await page.locator('svg.layer path').count();
	expect(pathCount).toBe(3);

	const firstPath = await page.locator('svg.layer path').first().getAttribute('d');
	expect(firstPath).toMatch(/^M /);
	expect(firstPath).toContain(' C ');
});

test('plus button adds a child node without moving the node', async ({ page }) => {
	await openMap(page);

	const root = nodeByText(page, 'Central idea');
	const before = await page.evaluate(() => {
		const n = window.__mindmap!.workspace.maps[0].rootNode;
		return { x: n.position.x, y: n.position.y };
	});

	await root.hover();
	await root.locator('.node-add').click();

	await page.waitForFunction(() => window.__mindmap!.workspace.maps[0].rootNode.children.length === 3);
	const childId = await page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode.children[2].id);
	expect(await page.evaluate(() => window.__mindmap!.canvas.selectedNodeId)).toBe(childId);

	const after = await page.evaluate(() => {
		const n = window.__mindmap!.workspace.maps[0].rootNode;
		return { x: n.position.x, y: n.position.y };
	});
	expect(after).toEqual(before);
});

test('node text stays single-line unless explicitly multi-line', async ({ page }) => {
	await openMap(page);

	const root = nodeByText(page, 'Central idea');
	const box = await root.boundingBox();
	expect(box!.height).toBeLessThan(40);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		w.createChild(w.maps[0].rootNode.id, 'hello world this is a longer label');
	});

	const child = nodeByText(page, 'hello world this is a longer label');
	await expect(child).toBeVisible();
	const childBox = await child.boundingBox();
	expect(childBox!.height).toBeLessThan(40);
});

test('clicking a node starts editing its text', async ({ page }) => {
	await openMap(page);

	await nodeByText(page, 'Central idea').click();

	const rootId = await page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode.id);
	const editing = await page.evaluate(() => window.__mindmap!.canvas.editingNodeId);
	expect(editing).toBe(rootId);

	// wait for the contenteditable to be focused, then type
	await page.waitForTimeout(50);
	await page.keyboard.type('Branch');
	await page.keyboard.press('Enter');
	expect(await page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode.text)).toBe(
		'Central ideaBranch'
	);
});

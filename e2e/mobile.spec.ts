import { expect, test, type Page } from '@playwright/test';
import { nodeByText } from './helpers';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

async function openMap(page: Page) {
	await page.goto('/workspace');
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
}

function touch(page: Page, type: 'down' | 'move' | 'up', x: number, y: number, id = 1) {
	return page.evaluate(
		([t, px, py, pid]) => {
			const el = document.querySelector('.canvas-root');
			if (!el) throw new Error('canvas not found');
			el.dispatchEvent(
				new PointerEvent(`pointer${t}`, {
					pointerId: pid,
					pointerType: 'touch',
					isPrimary: pid === 1,
					clientX: px,
					clientY: py,
					button: 0,
					bubbles: true,
					cancelable: true
				})
			);
		},
		[type, x, y, id] as const
	);
}

test('one-finger drag pans the canvas', async ({ page }) => {
	await openMap(page);

	const before = await page.evaluate(() => {
		const c = window.__mindmap!.canvas;
		return { x: c.x, y: c.y };
	});

	await touch(page, 'down', 350, 500, 1);
	await touch(page, 'move', 230, 580, 1);
	await touch(page, 'up', 230, 580, 1);

	const after = await page.evaluate(() => {
		const c = window.__mindmap!.canvas;
		return { x: c.x, y: c.y };
	});
	expect(after.x).toBeLessThan(before.x - 30);
	expect(after.y).toBeGreaterThan(before.y + 30);
});

test('two-finger pinch zooms the canvas', async ({ page }) => {
	await openMap(page);

	const zoomBefore = await page.evaluate(() => window.__mindmap!.canvas.zoom);

	await touch(page, 'down', 360, 400, 1);
	await touch(page, 'down', 360, 520, 2);
	await touch(page, 'move', 330, 360, 1);
	await touch(page, 'move', 330, 560, 2);
	await touch(page, 'up', 330, 360, 1);
	await touch(page, 'up', 330, 560, 2);

	const zoomAfter = await page.evaluate(() => window.__mindmap!.canvas.zoom);
	expect(zoomAfter).toBeGreaterThan(zoomBefore + 0.1);
});

test('tapping a node starts editing', async ({ page }) => {
	await openMap(page);

	const node = nodeByText(page, 'Central idea');
	const box = await node.boundingBox();
	expect(box).not.toBeNull();
	const cx = box!.x + box!.width / 2;
	const cy = box!.y + box!.height / 2;

	await page.evaluate(
		([x, y]) => {
			const el = document.querySelector('[data-node]');
			if (!el) throw new Error('node not found');
			const opts: PointerEventInit = {
				pointerId: 1,
				pointerType: 'touch',
				isPrimary: true,
				clientX: x,
				clientY: y,
				button: 0,
				bubbles: true
			};
			el.dispatchEvent(new PointerEvent('pointerdown', opts));
			el.dispatchEvent(new PointerEvent('pointerup', opts));
		},
		[cx, cy] as const
	);

	const rootId = await page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode.id);
	const editing = await page.evaluate(() => window.__mindmap!.canvas.editingNodeId);
	expect(editing).toBe(rootId);
});

test('node panel is a bottom sheet opened manually on mobile', async ({ page }) => {
	await openMap(page);

	await nodeByText(page, 'Central idea').tap();
	const panel = page.getByRole('complementary', { name: 'Node settings' });
	await expect(panel).not.toBeVisible();

	await page.getByRole('button', { name: 'Open node settings' }).click();
	await expect(panel).toBeVisible();

	const box = await panel.boundingBox();
	expect(box!.width).toBeGreaterThan(380);
	expect(box!.y + box!.height).toBeGreaterThan(830);
});

test('md editor is a bottom sheet within the viewport', async ({ page }) => {
	await openMap(page);

	// sidebar is closed by default on mobile; open it to reach the MD Editor toggle
	await page.getByRole('button', { name: 'Toggle sidebar' }).click();
	await page.getByRole('button', { name: 'MD Editor' }).click();
	const pane = page.getByRole('complementary', { name: 'Markdown editor' });
	await expect(pane).toBeVisible();

	// Docked to the bottom edge of the app (canvas) area, full width.
	const area = await page.evaluate(() => {
		const r = document.querySelector('.canvas-root')!.getBoundingClientRect();
		return { y: r.y, width: r.width, height: r.height };
	});
	const box = await pane.boundingBox();
	expect(box!.width).toBeGreaterThan(area.width - 10);
	expect(Math.abs(box!.y + box!.height - (area.y + area.height))).toBeLessThan(2);
});

test('plus button creates a child without editing the node', async ({ page }) => {
	await openMap(page);

	const root = nodeByText(page, 'Central idea');
	const before = await page.evaluate(() => window.__mindmap!.workspace.maps[0].rootNode.children.length);

	await root.locator('.node-add').tap();

	await page.waitForFunction(
		(n) => window.__mindmap!.workspace.maps[0].rootNode.children.length === n + 1,
		before
	);
	const childId = await page.evaluate(
		(n) => window.__mindmap!.workspace.maps[0].rootNode.children[n].id,
		before
	);
	expect(await page.evaluate(() => window.__mindmap!.canvas.selectedNodeId)).toBe(childId);
	expect(await page.evaluate(() => window.__mindmap!.canvas.editingNodeId)).toBeNull();
});

test('sidebar fits the viewport and closes via the backdrop', async ({ page }) => {
	await openMap(page);

	await page.getByRole('button', { name: 'Toggle sidebar' }).click();
	const sidebar = page.getByRole('complementary', { name: 'Maps sidebar' });
	await expect(sidebar).toBeVisible();
	const box = await sidebar.boundingBox();
	expect(box!.width).toBeLessThanOrEqual(390);
	expect(box!.width).toBeGreaterThan(0);

	// tap the backdrop to the right of the sidebar
	await page.touchscreen.tap(370, 420);
	await expect(sidebar).not.toBeVisible();
});

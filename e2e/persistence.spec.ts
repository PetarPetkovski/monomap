import { expect, test, type Page } from '@playwright/test';
import { nodeByText } from './helpers';

async function readWorkspaceFromIdb(page: Page) {
	return page.evaluate(async () => {
		const db = await new Promise<IDBDatabase>((resolve, reject) => {
			const req = indexedDB.open('keyval-store');
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
		try {
			const tx = db.transaction('keyval', 'readonly');
			const store = tx.objectStore('keyval');
			return await new Promise((resolve, reject) => {
				const req = store.get('mindmap:workspace');
				req.onsuccess = () => resolve(req.result);
				req.onerror = () => reject(req.error);
			});
		} finally {
			db.close();
		}
	});
}

function waitForIdbSave(page: Page) {
	return page.waitForFunction(
		async () => {
			try {
				const db = await new Promise<IDBDatabase>((resolve, reject) => {
					const req = indexedDB.open('keyval-store');
					req.onsuccess = () => resolve(req.result);
					req.onerror = () => reject(req.error);
				});
				try {
					const tx = db.transaction('keyval', 'readonly');
					const store = tx.objectStore('keyval');
					const value = await new Promise((resolve, reject) => {
						const req = store.get('mindmap:workspace');
						req.onsuccess = () => resolve(req.result);
						req.onerror = () => reject(req.error);
					});
					return value != null;
				} finally {
					db.close();
				}
			} catch {
				return false;
			}
		},
		undefined,
		{ timeout: 10_000 }
	);
}

test('workspace seeds and autosaves to IndexedDB', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (err) => errors.push(String(err)));

	await page.goto('/workspace');
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
	expect(errors).toHaveLength(0);

	await waitForIdbSave(page);
	await page.waitForTimeout(300);
	const saved = await readWorkspaceFromIdb(page);
	expect(saved).not.toBeNull();
	expect(saved.maps).toHaveLength(1);
	expect(saved.maps[0].rootNode.text).toBe('Central idea');
	expect(saved.openTabs).toEqual([saved.maps[0].id]);
});

test('deep mutations autosave through the reactive effect', async ({ page }) => {
	await page.goto('/workspace');
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });

	await page.evaluate(() => {
		const workspace = window.__mindmap!.workspace;
		workspace.renameMap(workspace.maps[0].id, 'Persistence Check');
		workspace.createChild(workspace.maps[0].rootNode.id, 'Child A');
		workspace.setNodeColor(workspace.maps[0].rootNode.id, '#ef4444');
	});

	await waitForIdbSave(page);
	await page.waitForTimeout(300);

	const saved = await readWorkspaceFromIdb(page);
	expect(saved.maps[0].title).toBe('Persistence Check');
	expect(saved.maps[0].rootNode.children).toHaveLength(3);
	expect(saved.maps[0].rootNode.children[2].text).toBe('Child A');
	expect(saved.maps[0].rootNode.style.color).toBe('#ef4444');
});

test('persisted workspace reloads on next boot', async ({ page }) => {
	await page.goto('/workspace');
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });

	await page.evaluate(() => {
		const workspace = window.__mindmap!.workspace;
		workspace.renameMap(workspace.maps[0].id, 'Reload Check');
		workspace.updateNodeText(workspace.maps[0].rootNode.id, 'Reload Root');
	});
	await waitForIdbSave(page);
	await page.waitForTimeout(300);

	await page.reload();
	await expect(nodeByText(page, 'Reload Root')).toBeVisible({ timeout: 15_000 });
	await expect(nodeByText(page, 'Central idea')).not.toBeVisible();

	const title = await page.evaluate(() => window.__mindmap!.workspace.maps[0].title);
	expect(title).toBe('Reload Check');
});

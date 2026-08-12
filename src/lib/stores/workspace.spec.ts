import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkspaceState } from '$lib/stores/workspace.svelte';

vi.mock('$lib/db/idb', () => ({
	loadWorkspace: vi.fn(() => Promise.resolve(undefined)),
	scheduleSave: vi.fn()
}));

async function freshStore(): Promise<{ store: WorkspaceState; scheduleSave: ReturnType<typeof vi.fn> }> {
	const idb = await import('$lib/db/idb');
	const { workspace } = await import('$lib/stores/workspace.svelte');
	return { store: workspace, scheduleSave: idb.scheduleSave as ReturnType<typeof vi.fn> };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('workspace store', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it('seeds the welcome map on first run', async () => {
		const { store } = await freshStore();
		await store.init();
		expect(store.ready).toBe(true);
		expect(store.maps).toHaveLength(1);
		expect(store.openTabs).toEqual([store.maps[0].id]);
		expect(store.activeTabId).toBe(store.maps[0].id);
		const root = store.getActiveMap()!.rootNode;
		expect(store.getActiveMap()?.title).toBe('Your First Map');
		expect(root.text).toBe('Central idea');
		expect(root.children.map((c) => c.text)).toEqual(['Node 1', 'Node 2']);
		expect(root.children[0].position.y).not.toBe(root.children[1].position.y);
	});

	it('creates child and sibling nodes', async () => {
		const { store } = await freshStore();
		await store.init();
		const rootId = store.maps[0].rootNode.id;
		expect(store.getActiveMap()?.rootNode.children).toHaveLength(2);
		const child = store.createChild(rootId, 'Child');
		expect(child).not.toBeNull();
		expect(store.getActiveMap()?.rootNode.children).toHaveLength(3);
		const sibling = store.createSibling(child!.id, 'Sibling');
		expect(sibling).not.toBeNull();
		expect(store.getActiveMap()?.rootNode.children).toHaveLength(4);
	});

	it('deletes nodes but never the root', async () => {
		const { store } = await freshStore();
		await store.init();
		const rootId = store.maps[0].rootNode.id;
		const child = store.createChild(rootId, 'Child');
		store.deleteNode(child!.id);
		expect(store.getActiveMap()?.rootNode.children).toHaveLength(2);
		store.deleteNode(rootId);
		expect(store.getActiveMap()?.rootNode.id).toBe(rootId);
	});

	it('duplicates a map with fresh ids and opens it', async () => {
		const { store } = await freshStore();
		await store.init();
		const mapId = store.maps[0].id;
		const copy = store.duplicateMap(mapId);
		expect(copy).not.toBeNull();
		expect(copy!.id).not.toBe(mapId);
		expect(copy!.rootNode.id).not.toBe(store.maps[0].rootNode.id);
		expect(store.openTabs).toContain(copy!.id);
		expect(store.activeTabId).toBe(copy!.id);
	});

	it('closing the last tab creates a fresh map', async () => {
		const { store } = await freshStore();
		await store.init();
		const mapId = store.maps[0].id;
		store.closeTab(mapId);
		expect(store.openTabs).toHaveLength(1);
		expect(store.openTabs[0]).not.toBe(mapId);
		expect(store.activeTabId).toBe(store.openTabs[0]);
	});
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceState } from '$lib/stores/workspace.svelte';
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

	it('creates a board with an Inbox column and opens it', async () => {
		const { store } = await freshStore();
		await store.init();
		const board = store.createBoard('Ship');
		expect(store.boards).toHaveLength(1);
		expect(board.columns).toHaveLength(1);
		expect(board.columns[0].title).toBe('Inbox');
		expect(store.activeBoardId).toBe(board.id);
		expect(store.viewMode).toBe('kanban');
	});

	it('adds columns and reorders them', async () => {
		const { store } = await freshStore();
		await store.init();
		const board = store.createBoard('Ship');
		const todo = store.addColumn(board.id, 'Todo')!;
		const done = store.addColumn(board.id, 'Done')!;
		store.moveColumn(board.id, done.id, 0);
		expect(board.columns.map((c) => c.title)).toEqual(['Done', 'Inbox', 'Todo']);
		store.renameColumn(board.id, todo.id, 'Doing');
		expect(board.columns[2].title).toBe('Doing');
	});

	it('creates, updates and moves cards across columns', async () => {
		const { store } = await freshStore();
		await store.init();
		const board = store.createBoard('Ship');
		const inbox = board.columns[0];
		const todo = store.addColumn(board.id, 'Todo')!;
		const card = store.createCard(board.id, inbox.id, 'Write spec')!;
		store.updateCardTitle(board.id, card.id, 'Write the spec');
		expect(card.title).toBe('Write the spec');
		store.moveCard(board.id, inbox.id, todo.id, card.id, 0);
		expect(inbox.cards).toHaveLength(0);
		expect(todo.cards.map((c) => c.id)).toEqual([card.id]);
		store.moveCard(board.id, todo.id, todo.id, card.id, 0);
		expect(todo.cards).toHaveLength(1);
	});

	it('supports labels, due dates and checklist items on a card', async () => {
		const { store } = await freshStore();
		await store.init();
		const board = store.createBoard('Ship');
		const card = store.createCard(board.id, board.columns[0].id, 'Card')!;
		store.setCardDescription(board.id, card.id, 'Body');
		store.addCardLabel(board.id, card.id, { text: 'bug', color: '#ef4444' });
		store.setCardDueDate(board.id, card.id, 1735689600000);
		store.addChecklistItem(board.id, card.id, 'Step 1');
		const item = card.checklist![0];
		store.toggleChecklistItem(board.id, card.id, item.id);
		expect(card.description).toBe('Body');
		expect(card.labels).toEqual([{ text: 'bug', color: '#ef4444' }]);
		expect(card.dueDate).toBe(1735689600000);
		expect(card.checklist).toHaveLength(1);
		expect(card.checklist![0].done).toBe(true);
		store.toggleChecklistItem(board.id, card.id, item.id);
		expect(card.checklist![0].done).toBe(false);
	});

	it('round-trips boards through serialize/restore', async () => {
		const { store } = await freshStore();
		await store.init();
		const board = store.createBoard('Ship');
		const card = store.createCard(board.id, board.columns[0].id, 'Card')!;
		store.setCardDueDate(board.id, card.id, 1735689600000);
		store.addChecklistItem(board.id, card.id, 'Step');
		const serialized = store.serialize();
		expect(serialized.version).toBe(2);
		expect(serialized.boards).toHaveLength(1);
		expect(serialized.viewMode).toBe('kanban');
		expect(serialized.activeBoardId).toBe(board.id);
		const restored = new WorkspaceState();
		restored.restore(serialized);
		expect(restored.boards).toHaveLength(1);
		expect(restored.boards[0].columns[0].cards[0].title).toBe('Card');
		expect(restored.boards[0].columns[0].cards[0].dueDate).toBe(1735689600000);
		expect(restored.viewMode).toBe('kanban');
		expect(restored.activeBoardId).toBe(board.id);
	});

	it('restores legacy v1 workspaces without boards', async () => {
		const { store } = await freshStore();
		await store.init();
		const legacy = store.serialize() as unknown as Record<string, unknown>;
		delete legacy.boards;
		store.restore(legacy as unknown as Parameters<typeof store.restore>[0]);
		expect(store.boards).toEqual([]);
		expect(store.viewMode).toBe('mindmap');
	});
});

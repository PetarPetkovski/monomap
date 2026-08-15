import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/db/idb', () => ({
	loadWorkspace: vi.fn(() => Promise.resolve(undefined)),
	scheduleSave: vi.fn()
}));

async function fresh() {
	const { workspace } = await import('$lib/stores/workspace.svelte');
	const link = await import('$lib/utils/kanbanLink');
	const { canvas } = await import('$lib/stores/canvas.svelte');
	return { workspace, link, canvas };
}

describe('kanbanLink bridge', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it('sends a node to a newly created linked board and opens it', async () => {
		const { workspace, link } = await fresh();
		await workspace.init();
		const map = workspace.maps[0];
		const root = map.rootNode;

		const result = link.sendNodeToBoard(map.id, root);
		expect(result).not.toBeNull();

		const board = workspace.boards.find((b) => b.id === result!.boardId)!;
		expect(board.sourceMapId).toBe(map.id);
		expect(board.title).toBe(`${map.title} Board`);
		expect(board.columns).toHaveLength(1);
		expect(board.columns[0].cards).toHaveLength(1);

		const card = board.columns[0].cards[0];
		expect(card.title).toBe('Central idea');
		expect(card.sourceNodeId).toBe(root.id);
		// Child nodes become checklist items.
		expect(card.checklist?.map((i) => i.text)).toEqual(['Node 1', 'Node 2']);

		expect(root.metadata?.kanbanCardId).toBe(card.id);
		expect(workspace.viewMode).toBe('kanban');
		expect(workspace.activeBoardId).toBe(board.id);
	});

	it('does not duplicate when the node is already linked', async () => {
		const { workspace, link } = await fresh();
		await workspace.init();
		const map = workspace.maps[0];
		const root = map.rootNode;

		const first = link.sendNodeToBoard(map.id, root)!;
		const second = link.sendNodeToBoard(map.id, root)!;
		expect(second.cardId).toBe(first.cardId);
		expect(workspace.boards).toHaveLength(1);
		expect(workspace.boards[0].columns[0].cards).toHaveLength(1);
	});

	it('re-links to the same board on subsequent nodes', async () => {
		const { workspace, link } = await fresh();
		await workspace.init();
		const map = workspace.maps[0];
		const root = map.rootNode;

		link.sendNodeToBoard(map.id, root);
		const child = root.children[0];
		const result = link.sendNodeToBoard(map.id, child);
		expect(workspace.boards).toHaveLength(1);
		expect(result!.boardId).toBe(workspace.boards[0].id);
		expect(child.metadata?.kanbanCardId).toBe(result!.cardId);
	});

	it('generates a board from a branch', async () => {
		const { workspace, link } = await fresh();
		await workspace.init();
		const map = workspace.maps[0];
		const root = map.rootNode;
		const col1 = root.children[0];
		workspace.createChild(col1.id, 'Sub A');
		workspace.createChild(col1.id, 'Sub B');

		const boardId = link.boardFromBranch(map.id, root);
		const board = workspace.boards.find((b) => b.id === boardId)!;
		expect(board.title).toBe('Central idea');
		expect(board.sourceMapId).toBe(map.id);
		expect(board.columns.map((c) => c.title)).toEqual(['Node 1', 'Node 2']);
		expect(board.columns[0].cards.map((c) => c.title)).toEqual(['Sub A', 'Sub B']);
		// Level-2 nodes are linked to their cards.
		expect(col1.children[0].metadata?.kanbanCardId).toBe(board.columns[0].cards[0].id);
		expect(workspace.viewMode).toBe('kanban');
		expect(workspace.activeBoardId).toBe(boardId);
	});

	it('keeps the Inbox column when a leaf branch is turned into a board', async () => {
		const { workspace, link } = await fresh();
		await workspace.init();
		const map = workspace.maps[0];
		const root = map.rootNode;
		const leaf = workspace.createChild(root.id, 'Leaf')!;

		const boardId = link.boardFromBranch(map.id, leaf);
		const board = workspace.boards.find((b) => b.id === boardId)!;
		expect(board.columns).toHaveLength(1);
		expect(board.columns[0].title).toBe('Inbox');
	});

	it('opens a node location back in the mind map', async () => {
		const { workspace, link, canvas } = await fresh();
		await workspace.init();
		const map = workspace.maps[0];
		const root = map.rootNode;

		link.sendNodeToBoard(map.id, root);
		expect(workspace.viewMode).toBe('kanban');
		link.openNodeLocation(map.id, root.id);
		expect(workspace.viewMode).toBe('mindmap');
		expect(workspace.activeTabId).toBe(map.id);
		expect(canvas.selectedNodeId).toBe(root.id);
	});
});

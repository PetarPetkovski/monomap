import type {
	Folder,
	KanbanBoard,
	KanbanCard,
	KanbanColumn,
	KanbanLabel,
	MapData,
	MindNode,
	Vec2,
	ViewMode,
	Workspace
} from '$lib/types';
import { loadWorkspace, scheduleSave } from '$lib/db/idb';
import { childPositions, cloneTree, findNode, findParent, insertChild, removeChild } from '$lib/utils/tree';
import { normalizeUrl } from '$lib/utils/url';
import {
	boardId as newBoardId,
	cardId as newCardId,
	columnId as newColumnId,
	folderId as newFolderId,
	mapId as newMapId,
	nodeId
} from '$lib/utils/id';

function createRootNode(text = 'Central idea'): MindNode {
	return { id: nodeId(), text, position: { x: 0, y: 0 }, children: [] };
}

function createMap(title = 'Untitled Map', folderId: string | null = null): MapData {
	const now = Date.now();
	return { id: newMapId(), folderId, title, createdAt: now, updatedAt: now, rootNode: createRootNode() };
}

// First-run welcome map: a central node with two children stacked at different heights.
function createFirstMap(): MapData {
	const now = Date.now();
	const root = createRootNode();
	root.children = [
		{ id: nodeId(), text: 'Node 1', position: { x: 240, y: -28 }, children: [] },
		{ id: nodeId(), text: 'Node 2', position: { x: 240, y: 28 }, children: [] }
	];
	return {
		id: newMapId(),
		folderId: null,
		title: 'Your First Map',
		createdAt: now,
		updatedAt: now,
		rootNode: root
	};
}

function cloneNode(node: MindNode): MindNode {
	return {
		id: node.id,
		text: node.text,
		position: { x: node.position.x, y: node.position.y },
		style: node.style ? { color: node.style.color, icon: node.style.icon } : undefined,
		notes: node.notes,
		links: node.links ? [...node.links] : undefined,
		metadata: node.metadata ? { kanbanCardId: node.metadata.kanbanCardId } : undefined,
		children: node.children.map(cloneNode)
	};
}

function cloneCard(card: KanbanCard): KanbanCard {
	return {
		id: card.id,
		title: card.title,
		description: card.description,
		labels: card.labels
			? card.labels.map((label) => ({ text: label.text, color: label.color }))
			: undefined,
		dueDate: card.dueDate,
		checklist: card.checklist
			? card.checklist.map((item) => ({ id: item.id, text: item.text, done: item.done }))
			: undefined,
		sourceNodeId: card.sourceNodeId
	};
}

function cloneColumn(column: KanbanColumn): KanbanColumn {
	return {
		id: column.id,
		title: column.title,
		cards: column.cards.map(cloneCard)
	};
}

function cloneBoard(board: KanbanBoard): KanbanBoard {
	return {
		id: board.id,
		title: board.title,
		sourceMapId: board.sourceMapId,
		columns: board.columns.map(cloneColumn),
		createdAt: board.createdAt,
		updatedAt: board.updatedAt
	};
}

export class WorkspaceState {
	ready = $state(false);
	activeTabId = $state<string>('');
	openTabs = $state<string[]>([]);
	folders = $state<Folder[]>([]);
	maps = $state<MapData[]>([]);
	viewMode = $state<ViewMode>('mindmap');
	activeBoardId = $state<string>('');
	boards = $state<KanbanBoard[]>([]);

	constructor() {
		$effect.root(() => {
			$effect(() => {
				if (!this.ready) return;
				const snapshot = this.serialize();
				scheduleSave(() => snapshot);
			});
		});
	}

	serialize(): Workspace {
		return {
			version: 2,
			activeTabId: this.activeTabId,
			openTabs: [...this.openTabs],
			folders: this.folders.map((folder) => ({
				id: folder.id,
				name: folder.name,
				createdAt: folder.createdAt
			})),
			maps: this.maps.map((map) => ({
				id: map.id,
				folderId: map.folderId,
				title: map.title,
				createdAt: map.createdAt,
				updatedAt: map.updatedAt,
				rootNode: cloneNode(map.rootNode)
			})),
			viewMode: this.viewMode,
			activeBoardId: this.activeBoardId,
			boards: this.boards.map(cloneBoard)
		};
	}

	async init(): Promise<void> {
		const saved = await loadWorkspace();
		if (saved && Array.isArray(saved.maps) && saved.maps.length > 0) {
			this.restore(saved);
		} else {
			const map = createFirstMap();
			this.maps = [map];
			this.openTabs = [map.id];
			this.activeTabId = map.id;
			this.folders = [];
			this.viewMode = 'mindmap';
			this.activeBoardId = '';
			this.boards = [];
		}
		this.ready = true;
	}

	restore(ws: Workspace): void {
		if (!ws || !Array.isArray(ws.maps)) return;
		this.maps = ws.maps;
		this.folders = ws.folders ?? [];
		const validIds = new Set(this.maps.map((m) => m.id));
		this.openTabs = (ws.openTabs ?? []).filter((id) => validIds.has(id));
		if (this.openTabs.length === 0 && this.maps.length > 0) this.openTabs = [this.maps[0].id];
		this.activeTabId = validIds.has(ws.activeTabId)
			? ws.activeTabId
			: this.openTabs[0] ?? this.maps[0]?.id ?? '';
		if (this.maps.length === 0) {
			const map = createMap();
			this.maps = [map];
			this.openTabs = [map.id];
			this.activeTabId = map.id;
		}
		this.boards = Array.isArray(ws.boards) ? ws.boards : [];
		const boardIds = new Set(this.boards.map((b) => b.id));
		this.activeBoardId = ws.activeBoardId && boardIds.has(ws.activeBoardId) ? ws.activeBoardId : '';
		this.viewMode = ws.viewMode === 'kanban' ? 'kanban' : 'mindmap';
	}

	// --- maps ---

	getActiveMap(): MapData | undefined {
		return this.maps.find((m) => m.id === this.activeTabId);
	}

	createMap(title = 'Untitled Map', folderId: string | null = null): MapData {
		return this.createMapFromRoot(title, createRootNode(), folderId);
	}

	createMapFromRoot(title: string, rootNode: MindNode, folderId: string | null = null): MapData {
		const map: MapData = {
			id: newMapId(),
			folderId,
			title,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			rootNode
		};
		this.maps = [...this.maps, map];
		this.openTab(map.id);
		return map;
	}

	setActiveMapRoot(rootNode: MindNode): void {
		const map = this.getActiveMap();
		if (map) {
			map.rootNode = rootNode;
			map.updatedAt = Date.now();
		}
	}

	renameMap(mapId: string, title: string): void {
		const map = this.maps.find((m) => m.id === mapId);
		if (map) {
			map.title = title;
			map.updatedAt = Date.now();
		}
	}

	duplicateMap(mapId: string): MapData | null {
		const source = this.maps.find((m) => m.id === mapId);
		if (!source) return null;
		const copy: MapData = {
			id: newMapId(),
			folderId: source.folderId,
			title: `${source.title} (copy)`,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			rootNode: cloneTree(source.rootNode)
		};
		this.maps = [...this.maps, copy];
		this.openTab(copy.id);
		return copy;
	}

	deleteMap(mapId: string): void {
		this.maps = this.maps.filter((m) => m.id !== mapId);
		this.openTabs = this.openTabs.filter((id) => id !== mapId);
		if (this.activeTabId === mapId) {
			if (this.openTabs.length === 0) {
				const fresh = createMap();
				this.maps = [...this.maps, fresh];
				this.openTabs = [fresh.id];
				this.activeTabId = fresh.id;
			} else {
				this.activeTabId = this.openTabs[0];
			}
		}
	}

	moveMap(mapId: string, folderId: string | null): void {
		const map = this.maps.find((m) => m.id === mapId);
		if (map) {
			map.folderId = folderId;
			map.updatedAt = Date.now();
		}
	}

	// --- folders ---

	createFolder(name: string): Folder {
		const folder: Folder = { id: newFolderId(), name, createdAt: Date.now() };
		this.folders = [...this.folders, folder];
		return folder;
	}

	renameFolder(folderId: string, name: string): void {
		const folder = this.folders.find((f) => f.id === folderId);
		if (folder) folder.name = name;
	}

	deleteFolder(folderId: string): void {
		this.folders = this.folders.filter((f) => f.id !== folderId);
		for (const map of this.maps) {
			if (map.folderId === folderId) map.folderId = null;
		}
	}

	// --- tabs ---

	openTab(mapId: string): void {
		if (!this.openTabs.includes(mapId)) this.openTabs = [...this.openTabs, mapId];
		this.activeTabId = mapId;
	}

	closeTab(mapId: string): void {
		if (this.openTabs.length <= 1) {
			const fresh = createMap();
			this.maps = [...this.maps, fresh];
			this.openTabs = [fresh.id];
			this.activeTabId = fresh.id;
			return;
		}
		const index = this.openTabs.indexOf(mapId);
		if (index === -1) return;
		const fallback = this.openTabs[index === this.openTabs.length - 1 ? index - 1 : index + 1];
		this.openTabs = this.openTabs.filter((id) => id !== mapId);
		if (this.activeTabId === mapId) this.activeTabId = fallback;
	}

	setActiveTab(mapId: string): void {
		if (this.openTabs.includes(mapId)) this.activeTabId = mapId;
	}

	// --- nodes ---

	private touch(mapId: string): void {
		const map = this.maps.find((m) => m.id === mapId);
		if (map) map.updatedAt = Date.now();
	}

	private activeMapRoot(): MindNode | null {
		return this.getActiveMap()?.rootNode ?? null;
	}

	createChild(parentId: string, text = ''): MindNode | null {
		const root = this.activeMapRoot();
		const parent = root ? findNode(root, parentId) : null;
		if (!parent) return null;
		const node: MindNode = { id: nodeId(), text, position: childPositions(parent), children: [] };
		insertChild(parent, node);
		this.touch(this.activeTabId);
		return node;
	}

	createSibling(id: string, text = ''): MindNode | null {
		const root = this.activeMapRoot();
		const found = root ? findParent(root, id) : null;
		if (!found) return null;
		const node: MindNode = {
			id: nodeId(),
			text,
			position: { x: found.parent.position.x + 240, y: found.child.position.y + 56 },
			children: []
		};
		const index = found.parent.children.indexOf(found.child);
		insertChild(found.parent, node, index + 1);
		this.touch(this.activeTabId);
		return node;
	}

	deleteNode(nodeId: string): void {
		const root = this.activeMapRoot();
		if (!root || nodeId === root.id) return;
		const found = findParent(root, nodeId);
		if (found) {
			removeChild(found.parent, nodeId);
			this.touch(this.activeTabId);
		}
	}

	updateNodeText(nodeId: string, text: string): void {
		const root = this.activeMapRoot();
		const node = root ? findNode(root, nodeId) : null;
		if (node) {
			node.text = text;
			this.touch(this.activeTabId);
		}
	}

	setNodePosition(nodeId: string, position: Vec2): void {
		const root = this.activeMapRoot();
		const node = root ? findNode(root, nodeId) : null;
		if (node) {
			node.position.x = position.x;
			node.position.y = position.y;
			this.touch(this.activeTabId);
		}
	}

	setNodeColor(nodeId: string, color: string): void {
		const root = this.activeMapRoot();
		const node = root ? findNode(root, nodeId) : null;
		if (node) {
			node.style ??= {};
			if (color) node.style.color = color;
			else delete node.style.color;
			this.touch(this.activeTabId);
		}
	}

	setNodeIcon(nodeId: string, icon: string): void {
		const root = this.activeMapRoot();
		const node = root ? findNode(root, nodeId) : null;
		if (node) {
			node.style ??= {};
			if (icon) node.style.icon = icon;
			else delete node.style.icon;
			this.touch(this.activeTabId);
		}
	}

	setNodeNotes(nodeId: string, notes: string): void {
		const root = this.activeMapRoot();
		const node = root ? findNode(root, nodeId) : null;
		if (!node) return;
		if (notes) node.notes = notes;
		else delete node.notes;
		this.touch(this.activeTabId);
	}

	addNodeLink(nodeId: string, url: string): void {
		const normalized = normalizeUrl(url);
		const root = this.activeMapRoot();
		const node = root ? findNode(root, nodeId) : null;
		if (!node || !normalized) return;
		node.links ??= [];
		if (!node.links.includes(normalized)) node.links.push(normalized);
		this.touch(this.activeTabId);
	}

	removeNodeLink(nodeId: string, url: string): void {
		const root = this.activeMapRoot();
		const node = root ? findNode(root, nodeId) : null;
		if (node?.links) {
			node.links = node.links.filter((l) => l !== url);
			if (node.links.length === 0) delete node.links;
			this.touch(this.activeTabId);
		}
	}

	// --- view mode ---

	setViewMode(mode: ViewMode): void {
		this.viewMode = mode;
	}

	// --- boards ---

	getActiveBoard(): KanbanBoard | undefined {
		return this.boards.find((b) => b.id === this.activeBoardId);
	}

	private touchBoard(boardId: string): void {
		const board = this.boards.find((b) => b.id === boardId);
		if (board) board.updatedAt = Date.now();
	}

	createBoard(title = 'Untitled Board', sourceMapId: string | null = null): KanbanBoard {
		const now = Date.now();
		const board: KanbanBoard = {
			id: newBoardId(),
			title,
			sourceMapId,
			columns: [{ id: newColumnId(), title: 'Inbox', cards: [] }],
			createdAt: now,
			updatedAt: now
		};
		this.boards = [...this.boards, board];
		this.openBoard(board.id);
		return board;
	}

	openBoard(boardId: string): void {
		if (!this.boards.some((b) => b.id === boardId)) return;
		this.activeBoardId = boardId;
		this.viewMode = 'kanban';
	}

	renameBoard(boardId: string, title: string): void {
		const board = this.boards.find((b) => b.id === boardId);
		if (board) {
			board.title = title;
			this.touchBoard(boardId);
		}
	}

	deleteBoard(boardId: string): void {
		this.boards = this.boards.filter((b) => b.id !== boardId);
		if (this.activeBoardId === boardId) {
			this.activeBoardId = this.boards[0]?.id ?? '';
			if (!this.activeBoardId) this.viewMode = 'mindmap';
		}
	}

	// --- columns ---

	addColumn(boardId: string, title = 'Column'): KanbanColumn | null {
		const board = this.boards.find((b) => b.id === boardId);
		if (!board) return null;
		const column: KanbanColumn = { id: newColumnId(), title, cards: [] };
		board.columns.push(column);
		this.touchBoard(boardId);
		return column;
	}

	renameColumn(boardId: string, columnId: string, title: string): void {
		const column = this.boards.find((b) => b.id === boardId)?.columns.find((c) => c.id === columnId);
		if (column) {
			column.title = title;
			this.touchBoard(boardId);
		}
	}

	deleteColumn(boardId: string, columnId: string): void {
		const board = this.boards.find((b) => b.id === boardId);
		if (board) {
			board.columns = board.columns.filter((c) => c.id !== columnId);
			this.touchBoard(boardId);
		}
	}

	moveColumn(boardId: string, columnId: string, toIndex: number): void {
		const board = this.boards.find((b) => b.id === boardId);
		if (!board) return;
		const from = board.columns.findIndex((c) => c.id === columnId);
		if (from === -1) return;
		const [column] = board.columns.splice(from, 1);
		const target = Math.min(board.columns.length, Math.max(0, toIndex));
		board.columns.splice(target, 0, column);
		this.touchBoard(boardId);
	}

	// --- cards ---

	createCard(boardId: string, columnId: string, title = ''): KanbanCard | null {
		const column = this.boards.find((b) => b.id === boardId)?.columns.find((c) => c.id === columnId);
		if (!column) return null;
		const card: KanbanCard = { id: newCardId(), title, sourceNodeId: null };
		column.cards.push(card);
		this.touchBoard(boardId);
		return card;
	}

	addCard(boardId: string, columnId: string, card: KanbanCard): KanbanCard | null {
		const column = this.boards.find((b) => b.id === boardId)?.columns.find((c) => c.id === columnId);
		if (!column) return null;
		column.cards.push(card);
		this.touchBoard(boardId);
		return card;
	}

	updateCardTitle(boardId: string, cardId: string, title: string): void {
		const board = this.boards.find((b) => b.id === boardId);
		const card = board?.columns.find((c) => c.cards.some((card) => card.id === cardId))?.cards.find(
			(card) => card.id === cardId
		);
		if (card) {
			card.title = title;
			this.touchBoard(boardId);
		}
	}

	setCardDescription(boardId: string, cardId: string, description: string): void {
		const card = this.findCard(boardId, cardId);
		if (!card) return;
		if (description) card.description = description;
		else delete card.description;
		this.touchBoard(boardId);
	}

	addCardLabel(boardId: string, cardId: string, label: KanbanLabel): void {
		const card = this.findCard(boardId, cardId);
		if (!card) return;
		card.labels ??= [];
		if (!card.labels.some((l) => l.text === label.text && l.color === label.color)) {
			card.labels.push({ text: label.text, color: label.color });
		}
		this.touchBoard(boardId);
	}

	removeCardLabel(boardId: string, cardId: string, index: number): void {
		const card = this.findCard(boardId, cardId);
		if (card?.labels) {
			card.labels.splice(index, 1);
			if (card.labels.length === 0) delete card.labels;
			this.touchBoard(boardId);
		}
	}

	setCardDueDate(boardId: string, cardId: string, dueDate: number | null): void {
		const card = this.findCard(boardId, cardId);
		if (!card) return;
		if (dueDate) card.dueDate = dueDate;
		else delete card.dueDate;
		this.touchBoard(boardId);
	}

	addChecklistItem(boardId: string, cardId: string, text = ''): void {
		const card = this.findCard(boardId, cardId);
		if (!card) return;
		card.checklist ??= [];
		card.checklist.push({ id: nodeId(), text, done: false });
		this.touchBoard(boardId);
	}

	toggleChecklistItem(boardId: string, cardId: string, itemId: string): void {
		const card = this.findCard(boardId, cardId);
		const item = card?.checklist?.find((i) => i.id === itemId);
		if (item) {
			item.done = !item.done;
			this.touchBoard(boardId);
		}
	}

	updateChecklistItemText(boardId: string, cardId: string, itemId: string, text: string): void {
		const card = this.findCard(boardId, cardId);
		const item = card?.checklist?.find((i) => i.id === itemId);
		if (item) {
			item.text = text;
			this.touchBoard(boardId);
		}
	}

	removeChecklistItem(boardId: string, cardId: string, itemId: string): void {
		const card = this.findCard(boardId, cardId);
		if (card?.checklist) {
			card.checklist = card.checklist.filter((i) => i.id !== itemId);
			if (card.checklist.length === 0) delete card.checklist;
			this.touchBoard(boardId);
		}
	}

	moveCard(boardId: string, fromColumnId: string, toColumnId: string, cardId: string, toIndex: number): void {
		const board = this.boards.find((b) => b.id === boardId);
		if (!board) return;
		const from = board.columns.find((c) => c.id === fromColumnId);
		const to = board.columns.find((c) => c.id === toColumnId);
		if (!from || !to) return;
		const fromIndex = from.cards.findIndex((c) => c.id === cardId);
		if (fromIndex === -1) return;
		const [card] = from.cards.splice(fromIndex, 1);
		let target = toIndex;
		if (toColumnId === fromColumnId && fromIndex < toIndex) target = toIndex - 1;
		target = Math.min(to.cards.length, Math.max(0, target));
		to.cards.splice(target, 0, card);
		this.touchBoard(boardId);
	}

	deleteCard(boardId: string, cardId: string): void {
		const board = this.boards.find((b) => b.id === boardId);
		const column = board?.columns.find((c) => c.cards.some((card) => card.id === cardId));
		if (column) {
			const card = column.cards.find((c) => c.id === cardId);
			column.cards = column.cards.filter((c) => c.id !== cardId);
			if (card?.sourceNodeId) this.clearNodeKanbanLink(card.sourceNodeId);
			this.touchBoard(boardId);
		}
	}

	// --- mind map ↔ kanban links ---

	setNodeKanbanLink(nodeId: string, cardId: string): void {
		for (const map of this.maps) {
			const node = findNode(map.rootNode, nodeId);
			if (node) {
				node.metadata ??= {};
				node.metadata.kanbanCardId = cardId;
				this.touch(map.id);
				return;
			}
		}
	}

	clearNodeKanbanLink(nodeId: string): void {
		for (const map of this.maps) {
			const node = findNode(map.rootNode, nodeId);
			if (node?.metadata) {
				delete node.metadata.kanbanCardId;
				if (Object.keys(node.metadata).length === 0) delete node.metadata;
				this.touch(map.id);
				return;
			}
		}
	}

	private findCard(boardId: string, cardId: string): KanbanCard | undefined {
		return this.boards
			.find((b) => b.id === boardId)
			?.columns.flatMap((c) => c.cards)
			.find((c) => c.id === cardId);
	}
}

export const workspace = new WorkspaceState();

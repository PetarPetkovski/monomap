import { workspace } from '$lib/stores/workspace.svelte';
import { canvas } from '$lib/stores/canvas.svelte';
import { kanban } from '$lib/stores/kanban.svelte';
import { cardId, nodeId } from '$lib/utils/id';
import { findNode } from '$lib/utils/tree';
import type { KanbanBoard, KanbanCard, MindNode } from '$lib/types';

export interface LinkLocation {
	boardId: string;
	cardId: string;
}

export function findCardLocation(cardIdToFind: string): LinkLocation | null {
	for (const board of workspace.boards) {
		for (const column of board.columns) {
			if (column.cards.some((c) => c.id === cardIdToFind)) {
				return { boardId: board.id, cardId: cardIdToFind };
			}
		}
	}
	return null;
}

export function linkedBoardForMap(mapId: string): KanbanBoard | undefined {
	return workspace.boards.find((b) => b.sourceMapId === mapId);
}

function buildCardFromNode(node: MindNode): KanbanCard {
	const card: KanbanCard = { id: cardId(), title: node.text, sourceNodeId: node.id };
	if (node.notes) card.description = node.notes;
	if (node.children.length > 0) {
		card.checklist = node.children.map((child) => ({
			id: nodeId(),
			text: child.text,
			done: false
		}));
	}
	return card;
}

export function openLinkedCard(location: LinkLocation): void {
	workspace.openBoard(location.boardId);
	kanban.openCard(location.boardId, location.cardId);
}

export function sendNodeToBoard(mapId: string, node: MindNode): LinkLocation | null {
	if (node.metadata?.kanbanCardId) {
		const existing = findCardLocation(node.metadata.kanbanCardId);
		if (existing) {
			openLinkedCard(existing);
			return existing;
		}
	}
	const map = workspace.maps.find((m) => m.id === mapId);
	let board = linkedBoardForMap(mapId);
	if (!board) {
		board = workspace.createBoard(map ? `${map.title} Board` : 'Board', mapId);
	}
	const column = board.columns[0];
	const card = buildCardFromNode(node);
	workspace.addCard(board.id, column.id, card);
	workspace.setNodeKanbanLink(node.id, card.id);
	const location = { boardId: board.id, cardId: card.id };
	openLinkedCard(location);
	return location;
}

export function boardFromBranch(mapId: string, node: MindNode): string | null {
	const board = workspace.createBoard(node.text, mapId);
	if (node.children.length === 0) return board.id;
	workspace.deleteColumn(board.id, board.columns[0].id);
	for (const colNode of node.children) {
		const column = workspace.addColumn(board.id, colNode.text || 'Column');
		if (!column) continue;
		for (const cardNode of colNode.children) {
			const card = buildCardFromNode(cardNode);
			workspace.addCard(board.id, column.id, card);
			workspace.setNodeKanbanLink(cardNode.id, card.id);
		}
	}
	return board.id;
}

export function openNodeLocation(mapId: string | null, nodeIdToOpen: string): void {
	let map = mapId ? workspace.maps.find((m) => m.id === mapId) : undefined;
	if (!map) map = workspace.maps.find((m) => findNode(m.rootNode, nodeIdToOpen));
	if (!map) return;
	const node = findNode(map.rootNode, nodeIdToOpen);
	workspace.openTab(map.id);
	workspace.setViewMode('mindmap');
	if (node) {
		canvas.pendingCenterId = node.id;
		canvas.selectNode(node.id);
	}
}

import { workspace } from '$lib/stores/workspace.svelte';

export interface KanbanDragState {
	kind: 'card' | 'column';
	boardId: string;
	cardId: string | null;
	columnId: string | null;
	fromColumnId: string | null;
}

export interface KanbanDropTarget {
	columnId: string;
	index: number;
}

export class KanbanState {
	editingCardBoardId = $state<string | null>(null);
	editingCardId = $state<string | null>(null);
	filterQuery = $state('');
	searchInputEl = $state<HTMLInputElement | null>(null);

	drag = $state<KanbanDragState | null>(null);
	dragPos = $state({ x: 0, y: 0 });
	dragOver = $state<KanbanDropTarget | null>(null);

	openCard(boardId: string, cardId: string): void {
		this.editingCardBoardId = boardId;
		this.editingCardId = cardId;
	}

	closeCard(): void {
		this.editingCardBoardId = null;
		this.editingCardId = null;
	}

	focusSearch(): void {
		this.searchInputEl?.focus();
		this.searchInputEl?.select();
	}

	clearFilter(): void {
		this.filterQuery = '';
	}

	startCardDrag(boardId: string, fromColumnId: string, cardId: string): void {
		this.drag = { kind: 'card', boardId, cardId, columnId: fromColumnId, fromColumnId };
		this.dragPos = { x: 0, y: 0 };
		this.dragOver = null;
	}

	startColumnDrag(boardId: string, columnId: string): void {
		this.drag = { kind: 'column', boardId, cardId: null, columnId, fromColumnId: null };
		this.dragPos = { x: 0, y: 0 };
		this.dragOver = null;
	}

	updateDragPos(x: number, y: number): void {
		this.dragPos = { x, y };
	}

	drop(): void {
		const d = this.drag;
		const over = this.dragOver;
		if (d && over && over.columnId) {
			if (d.kind === 'card' && d.cardId && d.fromColumnId) {
				workspace.moveCard(d.boardId, d.fromColumnId, over.columnId, d.cardId, over.index);
			} else if (d.kind === 'column' && d.columnId) {
				workspace.moveColumn(d.boardId, d.columnId, over.index);
			}
		}
		this.drag = null;
		this.dragOver = null;
	}

	cancelDrag(): void {
		this.drag = null;
		this.dragOver = null;
	}
}

export const kanban = new KanbanState();

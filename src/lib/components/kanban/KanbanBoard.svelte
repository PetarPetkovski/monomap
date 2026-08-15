<script lang="ts">
	import { workspace } from '$lib/stores/workspace.svelte';
	import { canvas } from '$lib/stores/canvas.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { kanban } from '$lib/stores/kanban.svelte';
	import { cardDropTarget, columnInsertIndex, type DropColumn } from '$lib/utils/kanbanDrop';
	import KanbanColumn from './KanbanColumn.svelte';
	import KanbanCardEditor from './KanbanCardEditor.svelte';
	import KanbanFilter from './KanbanFilter.svelte';

	const board = $derived(workspace.getActiveBoard());

	// On desktop the left sidebar overlays the board; offset the kanban area to clear it.
	const sidebarOffset = $derived(!ui.isCompact && canvas.sidebarOpen ? 272 : 0);

	let columnsEl = $state<HTMLDivElement | null>(null);

	let renamingTitle = $state(false);
	let titleDraft = $state('');

	let picking = $state(false);
	let panPointer: number | null = null;
	let panStartX = 0;
	let panStartScroll = 0;
	let panMoved = false;

	const dragLabel = $derived.by(() => {
		const d = kanban.drag;
		if (!d) return '';
		const b = workspace.boards.find((bb) => bb.id === d.boardId);
		if (!b) return '';
		if (d.kind === 'card' && d.cardId) {
			for (const c of b.columns) {
				const card = c.cards.find((k) => k.id === d.cardId);
				if (card) return card.title || 'Untitled card';
			}
		}
		if (d.kind === 'column' && d.columnId) {
			return b.columns.find((c) => c.id === d.columnId)?.title || 'Column';
		}
		return '';
	});

	$effect(() => {
		const pos = kanban.dragPos;
		const d = kanban.drag;
		if (!d) return;
		const container = columnsEl;
		if (!container) return;
		const cr = container.getBoundingClientRect();
		const slack = 24;
		const inside =
			pos.x >= cr.left - slack &&
			pos.x <= cr.right + slack &&
			pos.y >= cr.top - slack &&
			pos.y <= cr.bottom + slack;
		if (!inside) {
			kanban.dragOver = null;
			return;
		}
		const colEls = Array.from(document.querySelectorAll<HTMLElement>('[data-column]'));
		const cols: DropColumn[] = colEls.map((el) => {
			const rect = el.getBoundingClientRect();
			const cards = Array.from(el.querySelectorAll<HTMLElement>('[data-card]')).map((c) => {
				const r = c.getBoundingClientRect();
				return { id: c.dataset.card!, rect: r };
			});
			return { id: el.dataset.column!, rect, cards };
		});
		if (d.kind === 'card') {
			kanban.dragOver = cardDropTarget(cols, pos.x, pos.y, d.cardId);
		} else {
			const index = columnInsertIndex(cols, pos.x);
			kanban.dragOver = { columnId: cols[index]?.id ?? '', index };
		}
		if (cr.width > 0) {
			const edge = 60;
			if (pos.x < cr.left + edge) container.scrollLeft -= 14;
			else if (pos.x > cr.right - edge) container.scrollLeft += 14;
		}
	});

	function autofocus(el: HTMLInputElement) {
		el.focus();
	}

	$effect(() => {
		if (board) titleDraft = board.title;
	});

	function commitTitle() {
		const value = titleDraft.trim();
		if (board && value) workspace.renameBoard(board.id, value);
		renamingTitle = false;
	}

	function isInteractiveTarget(target: EventTarget | null): boolean {
		const el = target as HTMLElement | null;
		if (!el || !(el instanceof HTMLElement)) return true;
		return !!el.closest('[data-card], [data-column], button, input, textarea, select, a');
	}

	function onColumnsPointerDown(e: PointerEvent) {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		if (isInteractiveTarget(e.target)) return;
		panPointer = e.pointerId;
		panStartX = e.clientX;
		panStartScroll = columnsEl?.scrollLeft ?? 0;
		panMoved = false;
		columnsEl?.setPointerCapture(e.pointerId);
	}

	function onColumnsPointerMove(e: PointerEvent) {
		if (panPointer !== e.pointerId) return;
		const dx = e.clientX - panStartX;
		if (!panMoved && Math.abs(dx) < 4) return;
		panMoved = true;
		picking = true;
		if (columnsEl) columnsEl.scrollLeft = panStartScroll - dx;
	}

	function onColumnsPointerEnd(e: PointerEvent) {
		if (panPointer !== e.pointerId) return;
		panPointer = null;
		picking = false;
		if (columnsEl?.hasPointerCapture(e.pointerId)) columnsEl.releasePointerCapture(e.pointerId);
	}
</script>

{#if board}
	<div class="kanban" class:shifted={sidebarOffset > 0} class:picking>
		<header class="board-header">
			{#if renamingTitle}
				<input
					class="title-input"
					bind:value={titleDraft}
					use:autofocus
					onkeydown={(e) => {
						if (e.key === 'Enter') commitTitle();
						if (e.key === 'Escape') renamingTitle = false;
					}}
					onblur={commitTitle}
				/>
			{:else}
				<h1 class="board-title" title="Double-click to rename" ondblclick={() => (renamingTitle = true)}>
					{board.title}
				</h1>
			{/if}
			<div class="header-actions">
				<KanbanFilter />
				<button
					type="button"
					class="add-col"
					title="Add column"
					onclick={() => workspace.addColumn(board.id)}
				>
					＋ Column
				</button>
			</div>
		</header>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="columns"
			class:panning={picking}
			bind:this={columnsEl}
			onpointerdown={onColumnsPointerDown}
			onpointermove={onColumnsPointerMove}
			onpointerup={onColumnsPointerEnd}
			onpointercancel={onColumnsPointerEnd}
		>
			{#each board.columns as column (column.id)}
				<KanbanColumn boardId={board.id} sourceMapId={board.sourceMapId} {column} />
			{/each}
		</div>
		<KanbanCardEditor />
		{#if kanban.drag}
			<div class="ghost" style="left:{kanban.dragPos.x}px; top:{kanban.dragPos.y}px">
				{dragLabel}
			</div>
		{/if}
	</div>
{:else}
	<div class="kanban empty">
		<p class="empty-title">No board open</p>
		<p class="empty-hint">Create a board from the sidebar to get started.</p>
	</div>
{/if}

<style>
	.kanban {
		position: absolute;
		inset: 0;
		z-index: 10;
		display: flex;
		flex-direction: column;
		background: var(--canvas);
	}

	.kanban.shifted {
		left: 272px;
	}

	.ghost {
		position: fixed;
		transform: translate(-50%, -130%);
		pointer-events: none;
		z-index: 90;
		max-width: 260px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding: 8px 12px;
		border-radius: 9px;
		background: var(--surface);
		border: 1px solid var(--edge);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.2);
		font-size: 13px;
		opacity: 0.92;
	}

	.board-header {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		flex-wrap: wrap;
		gap: 8px 12px;
		padding: 64px 20px 8px;
		flex: none;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: none;
	}

	.board-title {
		font-size: 18px;
		font-weight: 650;
		margin: 0;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.title-input {
		font-size: 18px;
		font-weight: 650;
		padding: 3px 8px;
		border: 1px solid var(--accent);
		border-radius: 8px;
		background: var(--surface);
		color: var(--fg);
		outline: none;
	}

	.add-col {
		padding: 7px 12px;
		border: 1px solid var(--edge);
		border-radius: 8px;
		background: var(--surface);
		color: var(--fg);
		font-size: 12.5px;
		cursor: pointer;
	}

	.add-col:hover {
		background: var(--surface-2);
	}

	.columns {
		flex: 1;
		display: flex;
		gap: 14px;
		padding: 12px 20px 20px;
		overflow-x: auto;
		overflow-y: hidden;
		align-items: flex-start;
		cursor: grab;
		touch-action: pan-y;
	}

	.columns.panning {
		cursor: grabbing;
	}

	.kanban.picking {
		outline: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
		outline-offset: -2px;
	}

	.empty {
		align-items: center;
		justify-content: center;
		gap: 6px;
	}

	.empty-title {
		font-size: 16px;
		font-weight: 600;
		margin: 0;
	}

	.empty-hint {
		font-size: 13px;
		color: var(--muted);
		margin: 0;
	}

	@media (max-width: 640px) {
		.board-header {
			padding: calc(env(safe-area-inset-top) + 56px) 16px 8px;
		}

		.columns {
			padding-left: 12px;
			padding-right: 12px;
		}
	}
</style>

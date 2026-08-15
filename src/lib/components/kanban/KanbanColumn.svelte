<script lang="ts">
	import type { KanbanColumn } from '$lib/types';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { kanban } from '$lib/stores/kanban.svelte';
	import { cardMatches } from '$lib/utils/kanbanFilter';
	import KanbanCard from './KanbanCard.svelte';

	let {
		boardId,
		sourceMapId,
		column
	}: {
		boardId: string;
		sourceMapId: string | null;
		column: KanbanColumn;
	} = $props();

	let menuOpen = $state(false);
	let renaming = $state(false);
	let titleDraft = $state('');
	let addingCard = $state(false);
	let cardDraft = $state('');

	const count = $derived(column.cards.length);
	const isDragTarget = $derived(!!kanban.drag && kanban.dragOver?.columnId === column.id);

	let gripStart: { x: number; y: number } | null = null;

	function slotAt(index: number) {
		return isDragTarget && kanban.dragOver?.index === index;
	}

	function autofocus(el: HTMLInputElement) {
		el.focus();
	}

	function startRename() {
		titleDraft = column.title;
		renaming = true;
		menuOpen = false;
	}

	function commitRename() {
		const value = titleDraft.trim();
		if (value) workspace.renameColumn(boardId, column.id, value);
		renaming = false;
	}

	function commitCard() {
		const value = cardDraft.trim();
		if (value) {
			workspace.createCard(boardId, column.id, value);
			cardDraft = '';
		} else {
			addingCard = false;
		}
	}

	function gripPointerDown(e: PointerEvent) {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		gripStart = { x: e.clientX, y: e.clientY };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function gripPointerMove(e: PointerEvent) {
		if (!gripStart) return;
		if (!kanban.drag) {
			const dx = e.clientX - gripStart.x;
			const dy = e.clientY - gripStart.y;
			if (Math.hypot(dx, dy) > 4) {
				kanban.startColumnDrag(boardId, column.id);
				kanban.updateDragPos(e.clientX, e.clientY);
			}
		} else {
			kanban.updateDragPos(e.clientX, e.clientY);
		}
	}

	function gripPointerUp() {
		if (kanban.drag) kanban.drop();
		gripStart = null;
	}

	function gripPointerCancel() {
		if (kanban.drag) kanban.cancelDrag();
		gripStart = null;
	}
</script>

<section class="col" data-column={column.id}>
	<header class="col-head">
		<button
			type="button"
			class="grip"
			title="Drag to reorder column"
			aria-label="Drag column"
			onpointerdown={gripPointerDown}
			onpointermove={gripPointerMove}
			onpointerup={gripPointerUp}
			onpointercancel={gripPointerCancel}
		>
			⋮⋮
		</button>
		{#if renaming}
			<input
				class="head-input"
				bind:value={titleDraft}
				use:autofocus
				onkeydown={(e) => {
					if (e.key === 'Enter') commitRename();
					if (e.key === 'Escape') renaming = false;
				}}
				onblur={commitRename}
			/>
		{:else}
			<span
				class="col-title"
				title="Double-click to rename"
				role="button"
				tabindex="0"
				ondblclick={startRename}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						startRename();
					}
				}}
			>
				{column.title || 'Untitled column'}
			</span>
		{/if}
		<span class="col-count">{count}</span>
		<button
			type="button"
			class="menu-btn"
			aria-label="Column actions"
			onclick={() => (menuOpen = !menuOpen)}
		>
			⋯
		</button>
		{#if menuOpen}
			<div class="menu">
				<button type="button" onclick={startRename}>Rename</button>
				<button
					type="button"
					class="danger"
					onclick={() => {
						menuOpen = false;
						workspace.deleteColumn(boardId, column.id);
					}}
				>
					Delete
				</button>
			</div>
		{/if}
	</header>

	<div class="col-body">
		{#each column.cards as card, index (card.id)}
			{#if slotAt(index)}
				<div class="drop-slot" aria-hidden="true"></div>
			{/if}
			<KanbanCard {boardId} {sourceMapId} columnId={column.id} {card} hidden={!cardMatches(card, kanban.filterQuery)} />
		{/each}
		{#if slotAt(column.cards.length)}
			<div class="drop-slot" aria-hidden="true"></div>
		{/if}

		{#if addingCard}
			<input
				class="card-input"
				bind:value={cardDraft}
				placeholder="Card title…"
				use:autofocus
				onkeydown={(e) => {
					if (e.key === 'Enter') commitCard();
					if (e.key === 'Escape') {
						addingCard = false;
						cardDraft = '';
					}
				}}
				onblur={commitCard}
			/>
		{:else}
			<button type="button" class="add-card" onclick={() => (addingCard = true)}>
				＋ Add card
			</button>
		{/if}
	</div>
</section>

<style>
	.col {
		flex: none;
		width: 272px;
		max-height: 100%;
		display: flex;
		flex-direction: column;
		border-radius: 12px;
		border: 1px solid var(--edge);
		background: var(--surface-2);
	}

	.col-head {
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 8px 10px 8px;
		flex: none;
	}

	.grip {
		flex: none;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: 11px;
		letter-spacing: -1px;
		line-height: 1;
		cursor: grab;
		padding: 2px 4px;
		border-radius: 4px;
		touch-action: none;
		user-select: none;
	}

	.grip:hover {
		color: var(--fg);
		background: var(--surface);
	}

	.grip:active {
		cursor: grabbing;
	}

	.col-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 13px;
		font-weight: 600;
	}

	.head-input {
		flex: 1;
		min-width: 0;
		padding: 3px 6px;
		border: 1px solid var(--accent);
		border-radius: 6px;
		background: var(--surface);
		color: var(--fg);
		font-size: 13px;
		outline: none;
	}

	.col-count {
		flex: none;
		font-size: 11px;
		color: var(--muted);
		background: var(--surface);
		border-radius: 9999px;
		padding: 1px 8px;
	}

	.menu-btn {
		flex: none;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: 15px;
		line-height: 1;
		cursor: pointer;
		padding: 0 4px;
		border-radius: 4px;
	}

	.menu-btn:hover {
		color: var(--fg);
		background: var(--surface);
	}

	.menu {
		position: absolute;
		right: 6px;
		top: calc(100% - 4px);
		z-index: 30;
		min-width: 150px;
		background: var(--surface);
		border: 1px solid var(--edge);
		border-radius: 10px;
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.14);
		padding: 4px;
		display: flex;
		flex-direction: column;
	}

	.menu button {
		text-align: left;
		padding: 7px 10px;
		border: none;
		background: transparent;
		border-radius: 6px;
		color: var(--fg);
		font-size: 12.5px;
		cursor: pointer;
	}

	.menu button:hover {
		background: var(--surface-2);
	}

	.menu button.danger {
		color: #ef4444;
	}

	.col-body {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 4px 8px 8px;
		min-height: 60px;
	}

	.drop-slot {
		flex: none;
		height: 6px;
		border-radius: 9999px;
		background: var(--accent);
		opacity: 0.55;
		margin: 0 2px;
	}

	.card-input {
		padding: 9px 12px;
		border: 1px solid var(--accent);
		border-radius: 9px;
		background: var(--surface);
		color: var(--fg);
		font-size: 13px;
		outline: none;
	}

	.add-card {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		padding: 7px 10px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--muted);
		font-size: 12.5px;
		cursor: pointer;
	}

	.add-card:hover {
		background: var(--surface);
		color: var(--fg);
	}
</style>

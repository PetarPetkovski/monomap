<script lang="ts">
	import type { KanbanCard } from '$lib/types';
	import { kanban } from '$lib/stores/kanban.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { dueStatus, formatDueDate } from '$lib/utils/due';
	import { openNodeLocation } from '$lib/utils/kanbanLink';

	let {
		boardId,
		sourceMapId,
		columnId,
		card,
		hidden = false
	}: { boardId: string; sourceMapId: string | null; columnId: string; card: KanbanCard; hidden?: boolean } =
		$props();

	const doneCount = $derived(card.checklist?.filter((i) => i.done).length ?? 0);
	const total = $derived(card.checklist?.length ?? 0);
	const due = $derived(card.dueDate ? dueStatus(card.dueDate) : null);
	const firstLine = $derived(
		card.description ? card.description.replace(/\r\n/g, '\n').split('\n').find((l) => l.trim())?.trim() ?? '' : ''
	);

	let pointerStart: { x: number; y: number } | null = null;
	let suppressClick = false;

	let renaming = $state(false);
	let titleDraft = $state('');
	let dblPending = false;
	let dblTimer: ReturnType<typeof setTimeout> | undefined;

	function clearDbl() {
		if (dblTimer) clearTimeout(dblTimer);
		dblTimer = undefined;
		dblPending = false;
	}

	function startRename() {
		titleDraft = card.title;
		renaming = true;
	}

	function commitRename() {
		const value = titleDraft.trim();
		if (value) workspace.updateCardTitle(boardId, card.id, value);
		renaming = false;
	}

	function autofocus(el: HTMLInputElement) {
		el.focus();
		el.select();
	}

	function handleClick() {
		if (suppressClick) return;
		if (dblPending) {
			clearDbl();
			startRename();
			return;
		}
		dblPending = true;
		dblTimer = setTimeout(() => {
			dblPending = false;
			kanban.openCard(boardId, card.id);
		}, 220);
	}

	function onPointerDown(e: PointerEvent) {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		pointerStart = { x: e.clientX, y: e.clientY };
	}

	function onPointerMove(e: PointerEvent) {
		if (!pointerStart) return;
		if (!kanban.drag) {
			const dx = e.clientX - pointerStart.x;
			const dy = e.clientY - pointerStart.y;
			if (Math.hypot(dx, dy) > 4) {
				clearDbl();
				(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
				kanban.startCardDrag(boardId, columnId, card.id);
				kanban.updateDragPos(e.clientX, e.clientY);
			}
		} else {
			kanban.updateDragPos(e.clientX, e.clientY);
		}
	}

	function onPointerUp(e: PointerEvent) {
		if (kanban.drag) {
			kanban.drop();
			suppressClick = true;
			setTimeout(() => (suppressClick = false), 0);
			clearDbl();
		}
		const el = e.currentTarget as HTMLElement;
		if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
		pointerStart = null;
	}

	function onPointerCancel(e: PointerEvent) {
		if (kanban.drag) kanban.cancelDrag();
		clearDbl();
		const el = e.currentTarget as HTMLElement;
		if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
		pointerStart = null;
	}

	function chipFg(color: string): string {
		const hex = color.replace('#', '');
		if (hex.length !== 6) return '#ffffff';
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
		const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		return lum > 0.6 ? '#1a1a1a' : '#ffffff';
	}
</script>

<div
	class="card"
	class:is-hidden={hidden}
	data-card={card.id}
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			if (dblPending) clearDbl();
			kanban.openCard(boardId, card.id);
		}
	}}
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerCancel}
>
	{#if renaming}
		<input
			class="rename-input"
			bind:value={titleDraft}
			placeholder="Card title"
			use:autofocus
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				e.stopPropagation();
				if (e.key === 'Enter') commitRename();
				if (e.key === 'Escape') renaming = false;
			}}
			onblur={commitRename}
		/>
	{:else if card.title}
		<span class="title">{card.title}</span>
	{/if}
	{#if card.labels?.length}
		<div class="labels">
			{#each card.labels as label (label.text + label.color)}
				<span
					class="chip"
					style:--chip={label.color}
					style:--chip-fg={chipFg(label.color)}
					title={label.text}
				>
					{label.text}
				</span>
			{/each}
		</div>
	{/if}
	{#if firstLine}
		<span class="desc">{firstLine}</span>
	{/if}
	{#if total > 0}
		<div class="checklist" title={`${doneCount}/${total} done`}>
			<span class="progress" style:--done={total > 0 ? (doneCount / total) * 100 : 0}></span>
			<span class="check-text">☑ {doneCount}/{total}</span>
		</div>
	{/if}
	{#if due}
		<span class="due" class:overdue={due === 'overdue'} class:soon={due === 'soon'}>
			🗓 {formatDueDate(card.dueDate!)}
		</span>
	{/if}
	{#if card.sourceNodeId}
		<button
			type="button"
			class="map-link"
			title="Open in mind map"
			onclick={(e) => {
				e.stopPropagation();
				openNodeLocation(sourceMapId, card.sourceNodeId!);
			}}
		>
			Map ↗
		</button>
	{/if}
</div>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 6px;
		background: var(--surface);
		border: 1px solid var(--edge);
		border-radius: 9px;
		padding: 10px 12px;
		font-size: 13px;
		box-shadow: var(--node-shadow);
		cursor: pointer;
		user-select: none;
		touch-action: none;
	}

	.card:hover {
		border-color: var(--muted);
	}

	.card.is-hidden {
		display: none;
	}

	.title {
		line-height: 1.4;
		word-break: break-word;
	}

	.rename-input {
		width: 100%;
		padding: 3px 6px;
		border: 1px solid var(--accent);
		border-radius: 6px;
		background: var(--surface);
		color: var(--fg);
		font-size: 13px;
		outline: none;
	}

	.labels {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.chip {
		font-size: 11px;
		font-weight: 600;
		padding: 1px 8px;
		border-radius: 9999px;
		color: var(--chip-fg, #fff);
		background: var(--chip);
	}

	.desc {
		font-size: 12px;
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.checklist {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.progress {
		flex: 1;
		height: 5px;
		border-radius: 9999px;
		background: var(--surface-2);
		overflow: hidden;
		position: relative;
	}

	.progress::after {
		content: '';
		position: absolute;
		inset: 0;
		width: calc(var(--done) * 1%);
		background: var(--accent);
		border-radius: inherit;
	}

	.check-text {
		flex: none;
		font-size: 11px;
		color: var(--muted);
	}

	.due {
		align-self: flex-start;
		font-size: 11px;
		font-weight: 600;
		padding: 1px 8px;
		border-radius: 9999px;
		color: var(--muted);
		background: var(--surface-2);
	}

	.due.soon {
		color: #b45309;
		background: color-mix(in srgb, #f59e0b 20%, transparent);
	}

	.due.overdue {
		color: #dc2626;
		background: color-mix(in srgb, #ef4444 16%, transparent);
	}

	.map-link {
		align-self: flex-start;
		flex: none;
		border: none;
		background: transparent;
		color: var(--accent);
		font-size: 11px;
		font-weight: 600;
		padding: 0;
		cursor: pointer;
	}

	.map-link:hover {
		text-decoration: underline;
	}

	:global(.dark) .due.soon {
		color: #fbbf24;
	}

	:global(.dark) .due.overdue {
		color: #f87171;
	}
</style>

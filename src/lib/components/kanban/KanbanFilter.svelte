<script lang="ts">
	import { kanban } from '$lib/stores/kanban.svelte';

	function clear() {
		kanban.filterQuery = '';
	}
</script>

<div class="filter" role="search">
	<span class="icon" aria-hidden="true">⌕</span>
	<input
		bind:this={kanban.searchInputEl}
		bind:value={kanban.filterQuery}
		type="text"
		placeholder="Filter cards (Ctrl+F)"
		aria-label="Filter cards"
		spellcheck="false"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				kanban.filterQuery = '';
				(e.currentTarget as HTMLInputElement).blur();
			}
		}}
	/>
	{#if kanban.filterQuery}
		<button type="button" class="clear" aria-label="Clear filter" onclick={clear}>
			&times;
		</button>
	{/if}
</div>

<style>
	.filter {
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		width: 200px;
		max-width: 40vw;
	}

	.icon {
		position: absolute;
		left: 10px;
		font-size: 13px;
		color: var(--muted);
		pointer-events: none;
	}

	input {
		width: 100%;
		min-width: 0;
		padding: 7px 28px 7px 28px;
		border: 1px solid var(--edge);
		border-radius: 8px;
		background: var(--surface);
		color: var(--fg);
		font-size: 12.5px;
		outline: none;
	}

	input:focus {
		border-color: var(--accent);
	}

	input::placeholder {
		color: var(--muted);
	}

	.clear {
		position: absolute;
		right: 6px;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: 16px;
		line-height: 1;
		cursor: pointer;
		padding: 2px 4px;
		border-radius: 4px;
	}

	.clear:hover {
		color: var(--fg);
		background: var(--surface-2);
	}

	@media (max-width: 640px) {
		.filter {
			width: 140px;
		}
	}
</style>

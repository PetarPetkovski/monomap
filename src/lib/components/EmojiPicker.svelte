<script lang="ts">
	import { EMOJIS } from '$lib/data/emojis';

	let { current, onselect }: { current?: string; onselect: (emoji: string) => void } = $props();

	let query = $state('');

	function autofocus(el: HTMLInputElement) {
		el.focus();
	}

	const filtered = $derived(
		query
			? EMOJIS.filter(
					(item) => item.e === query || item.n.some((k) => k.includes(query.toLowerCase()))
				)
			: EMOJIS
	);
</script>

<div class="picker">
	<input
		bind:value={query}
		type="text"
		placeholder="Search emojis&hellip;"
		use:autofocus
		spellcheck="false"
		onkeydown={(e) => {
			if (e.key === 'Escape') e.stopPropagation();
		}}
	/>
	<div class="grid">
		{#each filtered as item (item.e)}
			<button
				type="button"
				class="cell"
				class:selected={item.e === current}
				title={item.n[0]}
				aria-label={item.n[0]}
				onclick={() => onselect(item.e)}
			>
				{item.e}
			</button>
		{/each}
		{#if filtered.length === 0}
			<span class="empty">No matches</span>
		{/if}
	</div>
</div>

<style>
	.picker {
		padding: 8px;
		border-top: 1px solid var(--edge);
	}

	input {
		width: 100%;
		padding: 6px 10px;
		border-radius: 8px;
		border: 1px solid var(--edge);
		background: var(--surface-2);
		color: var(--fg);
		font-size: 12px;
		outline: none;
	}

	input:focus {
		border-color: var(--accent);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: 2px;
		margin-top: 8px;
		max-height: 200px;
		overflow-y: auto;
	}

	.cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 32px;
		border: none;
		background: transparent;
		border-radius: 6px;
		font-size: 17px;
		cursor: pointer;
		transition: background 0.1s ease;
	}

	.cell:hover {
		background: var(--surface-2);
	}

	.cell.selected {
		background: var(--surface-2);
	}

	.empty {
		grid-column: 1 / -1;
		text-align: center;
		color: var(--muted);
		font-size: 12px;
		padding: 8px;
	}
</style>

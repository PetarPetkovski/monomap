<script lang="ts">
	import { canvas } from '$lib/stores/canvas.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { countNodes } from '$lib/utils/tree';

	const freshMap = $derived.by(() => {
		const map = workspace.getActiveMap();
		if (!map || canvas.editingNodeId !== null) return false;
		return countNodes(map.rootNode) === 1;
	});

	const barLeft = $derived(ui.isCompact ? '50%' : canvas.mdPaneOpen ? 'calc(50% + 326px)' : '50%');
</script>

{#if !ui.isCompact && settings.shortcutsEnabled}
	<div class="bar" style:left={barLeft}>
		{#if freshMap}
			<span class="item">Press <kbd>Tab</kbd> to add a node</span>
			<span class="sep">·</span>
		{/if}
		<span class="item"><kbd>Tab</kbd> child</span>
		<span class="sep">·</span>
		<span class="item"><kbd>Enter</kbd> sibling</span>
		<span class="sep">·</span>
		<span class="item"><kbd>Space</kbd> edit</span>
		<span class="sep">·</span>
		<span class="item"><kbd>↑↓←→</kbd> move</span>
		<span class="sep">·</span>
		<span class="item"><kbd>Del</kbd> delete</span>
		<span class="sep">·</span>
		<span class="item"><kbd>Ctrl/⌘ 0</kbd> center</span>
		<span class="sep">·</span>
		<button
			type="button"
			class="action hide"
			title="Hide shortcuts"
			aria-label="Hide shortcuts"
			onclick={() => settings.toggleShortcuts()}
		>
			&times;
		</button>
	</div>
{/if}

<style>
	.bar {
		position: absolute;
		left: 50%;
		bottom: 14px;
		transform: translateX(-50%);
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		row-gap: 4px;
		gap: 8px;
		max-width: calc(100vw - 640px);
		padding: 7px 12px;
		border-radius: 9999px;
		background: var(--surface);
		border: 1px solid var(--edge);
		box-shadow: var(--node-shadow);
		color: var(--muted);
		font-size: 12px;
		overflow: hidden;
	}

	.item {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.sep {
		opacity: 0.5;
	}

	kbd {
		font-family: inherit;
		font-size: 11px;
		font-weight: 600;
		color: var(--fg);
		background: var(--surface-2);
		border: 1px solid var(--edge);
		border-bottom-width: 2px;
		border-radius: 4px;
		padding: 1px 5px;
	}

	.action {
		border: none;
		background: transparent;
		color: var(--accent);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		padding: 2px 4px;
		border-radius: 4px;
	}

	.action:hover {
		background: var(--surface-2);
	}

	.action.hide {
		color: var(--muted);
		font-weight: 400;
	}

	.action.hide:hover {
		color: var(--fg);
	}
</style>

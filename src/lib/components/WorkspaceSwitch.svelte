<script lang="ts">
	import { workspace } from '$lib/stores/workspace.svelte';
	import { ui } from '$lib/stores/ui.svelte';

	$effect(() => {
		if (workspace.viewMode === 'kanban' && !workspace.getActiveBoard() && workspace.boards.length > 0) {
			workspace.activeBoardId = workspace.boards[0].id;
		}
	});
</script>

<div class="switch" role="group" aria-label="Workspace mode">
	<button
		type="button"
		class="seg"
		class:active={workspace.viewMode === 'mindmap'}
		aria-pressed={workspace.viewMode === 'mindmap'}
		title="Mind Map"
		onclick={() => workspace.setViewMode('mindmap')}
	>
		<span class="glyph">🧠</span>
		<span class="seg-label">Mind Map</span>
	</button>
	<button
		type="button"
		class="seg"
		class:active={workspace.viewMode === 'kanban'}
		aria-pressed={workspace.viewMode === 'kanban'}
		title="Kanban Board"
		onclick={() => workspace.setViewMode('kanban')}
	>
		<span class="glyph">📋</span>
		<span class="seg-label">Kanban</span>
	</button>
</div>

<style>
	.switch {
		position: absolute;
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 36;
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 3px;
		border-radius: 10px;
		background: var(--surface);
		border: 1px solid var(--edge);
		box-shadow: 0 4px 16px rgb(0 0 0 / 0.1);
	}

	@media (max-width: 640px) {
		.switch {
			top: calc(env(safe-area-inset-top) + 8px);
			left: 50%;
			transform: translateX(-50%);
		}
	}

	.seg {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px 12px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--muted);
		font-size: 12.5px;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background 0.1s ease,
			color 0.1s ease;
	}

	.seg:hover {
		background: var(--surface-2);
		color: var(--fg);
	}

	.seg.active {
		background: var(--surface-2);
		color: var(--fg);
		font-weight: 600;
	}

	.glyph {
		font-size: 13px;
		line-height: 1;
	}

	@media (max-width: 480px) {
		.seg-label {
			display: none;
		}
	}
</style>

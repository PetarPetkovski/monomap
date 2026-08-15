<script lang="ts">
	import { canvas } from '$lib/stores/canvas.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';

	const tabs = $derived(workspace.openTabs);
	const activeTabId = $derived(workspace.activeTabId);
	const visible = $derived(tabs.length > 1 && workspace.viewMode === 'mindmap');
	const tabLeft = $derived(ui.isCompact ? '50%' : canvas.mdPaneOpen ? 'calc(50% + 326px)' : '50%');

	function title(id: string) {
		return workspace.maps.find((m) => m.id === id)?.title ?? 'Untitled Map';
	}
</script>

{#if visible}
	<div
		class="tabbar"
		style:left={tabLeft}
		role="tablist"
		aria-label="Open maps"
	>
		{#each tabs as id (id)}
			<button
				type="button"
				class="tab"
				class:active={id === activeTabId}
				role="tab"
				aria-selected={id === activeTabId}
				title={title(id)}
				onclick={() => workspace.setActiveTab(id)}
			>
				<span class="tab-title">{title(id)}</span>
				<span
					class="tab-close"
					role="button"
					tabindex="0"
					aria-label="Close tab"
					onclick={(e) => {
						e.stopPropagation();
						workspace.closeTab(id);
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							e.stopPropagation();
							workspace.closeTab(id);
						}
					}}
				>
					&times;
				</span>
			</button>
		{/each}
		<button
			type="button"
			class="new-tab"
			title="New map (Ctrl/Cmd+T)"
			aria-label="New map"
			onclick={() => workspace.createMap()}
		>
			＋
		</button>
	</div>
{/if}

<style>
	.tabbar {
		position: absolute;
		top: 58px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 35;
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 4px;
		border-radius: 10px;
		background: var(--surface);
		border: 1px solid var(--edge);
		box-shadow: 0 4px 16px rgb(0 0 0 / 0.1);
		max-width: min(70vw, 720px);
		overflow-x: auto;
	}

	@media (max-width: 640px) {
		.tabbar {
			top: calc(env(safe-area-inset-top) + 58px);
			max-width: calc(100vw - 24px);
		}
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px 8px;
		border: none;
		border-radius: 7px;
		background: transparent;
		color: var(--muted);
		font-size: 12.5px;
		cursor: pointer;
		max-width: 180px;
		white-space: nowrap;
	}

	.tab:hover {
		background: var(--surface-2);
		color: var(--fg);
	}

	.tab.active {
		background: var(--surface-2);
		color: var(--fg);
		font-weight: 600;
	}

	.tab-title {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tab-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		border-radius: 4px;
		font-size: 13px;
		line-height: 1;
		color: var(--muted);
	}

	.tab-close:hover {
		background: var(--surface);
		color: var(--fg);
	}

	.new-tab {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		border-radius: 7px;
		background: transparent;
		color: var(--muted);
		font-size: 14px;
		cursor: pointer;
	}

	.new-tab:hover {
		background: var(--surface-2);
		color: var(--fg);
	}
</style>

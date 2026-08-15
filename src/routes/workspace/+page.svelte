<script lang="ts">
	import { onMount } from 'svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import Keyboard from '$lib/components/Keyboard.svelte';
	import NodePanel from '$lib/components/NodePanel.svelte';
	import MdPane from '$lib/components/MdPane.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import TabBar from '$lib/components/TabBar.svelte';
	import ShortcutsBar from '$lib/components/ShortcutsBar.svelte';
	import WorkspaceSwitch from '$lib/components/WorkspaceSwitch.svelte';
	import KanbanBoard from '$lib/components/kanban/KanbanBoard.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { canvas } from '$lib/stores/canvas.svelte';

	let ready = $state(false);

	onMount(() => {
		void workspace.init().then(() => {
			window.__mindmap = { workspace, canvas };
			requestAnimationFrame(() => (ready = true));
		});
	});
</script>

<svelte:head>
	<title>{workspace.viewMode === 'kanban'
		? workspace.getActiveBoard()?.title ?? 'MonoMap'
		: workspace.getActiveMap()?.title ?? 'MonoMap'}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !ready}
	<main class="flex h-full flex-col items-center justify-center gap-3 select-none">
		<div class="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/30">
			<svg width="34" height="34" viewBox="0 0 32 32" fill="none">
				<circle cx="16" cy="16" r="7" fill="var(--accent)" />
				<circle cx="16" cy="16" r="3.5" fill="var(--canvas)" />
			</svg>
		</div>
		<h1 class="text-lg font-semibold tracking-tight">MonoMap</h1>
		<p class="text-sm text-muted">Loading workspace&hellip;</p>
	</main>
{:else}
	<div class="relative h-dvh w-full overflow-hidden">
		<Keyboard />
		<div class="absolute inset-0" class:hidden={workspace.viewMode === 'kanban'}>
			<Canvas />
			<MdPane />
			<NodePanel />
			<TabBar />
		</div>
		{#if workspace.viewMode === 'kanban'}
			<KanbanBoard />
		{/if}
		<WorkspaceSwitch />
		<Sidebar />
		<ShortcutsBar />
	</div>
{/if}

<style>
	main {
		height: 100dvh;
	}
</style>

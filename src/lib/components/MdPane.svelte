<script lang="ts">
	import { onDestroy } from 'svelte';
	import { canvas } from '$lib/stores/canvas.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { autoSortTree } from '$lib/utils/treeExport';
	import { mergeTree, outlineFromTree, parseOutline } from '$lib/utils/mdSync';

	let ta = $state<HTMLTextAreaElement | null>(null);
	let draft = $state('');
	let focused = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let lastTabId: string | null = null;

	const activeMap = $derived(workspace.getActiveMap());

	function outlineOfActive(): string {
		const map = workspace.getActiveMap();
		return map ? outlineFromTree(map.rootNode) : '';
	}

	// Write the outline into the textarea whenever the active map changes or the
	// pane regains a ref — but never while the user is typing (caret safety).
	$effect(() => {
		const id = workspace.activeTabId;
		const el = ta;
		if (id !== lastTabId) {
			lastTabId = id;
			focused = false;
		}
		if (!el || focused) return;
		const outline = outlineOfActive();
		if (el.value !== outline) {
			draft = outline;
			el.value = outline;
		}
	});

	function applyNow() {
		const map = workspace.getActiveMap();
		if (!map) return;
		const parsed = parseOutline(draft);
		workspace.setActiveMapRoot(mergeTree(map.rootNode, parsed));
	}

	function flush() {
		if (timer) {
			clearTimeout(timer);
			timer = undefined;
			applyNow();
		}
	}

	function scheduleApply(value: string) {
		draft = value;
		clearTimeout(timer);
		timer = setTimeout(() => {
			timer = undefined;
			applyNow();
		}, 200);
	}

	function onInput() {
		if (ta) scheduleApply(ta.value);
	}

	function reLayout() {
		const map = workspace.getActiveMap();
		if (map) autoSortTree(map.rootNode);
	}

	onDestroy(() => {
		flush();
	});
</script>

{#if canvas.mdPaneOpen}
	<div class="pane" role="complementary" aria-label="Markdown editor">
		<header>
			<span class="title">{activeMap?.title ?? 'Map'}</span>
			<button
				type="button"
				class="tool"
				title="Re-layout map"
				aria-label="Re-layout map"
				onclick={reLayout}
			>
				⇆
			</button>
			<button
				type="button"
				class="close"
				title="Hide markdown editor"
				aria-label="Hide markdown editor"
				onclick={() => (canvas.mdPaneOpen = false)}
			>
				&times;
			</button>
		</header>
		<textarea
			bind:this={ta}
			spellcheck="false"
			aria-label="Markdown outline"
			onfocus={() => (focused = true)}
			onblur={() => {
				flush();
				focused = false;
			}}
			oninput={onInput}
		></textarea>
	</div>
{/if}

<style>
	.pane {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 272px;
		width: 380px;
		z-index: 45;
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border-right: 1px solid var(--edge);
		box-shadow: 8px 0 24px rgb(0 0 0 / 0.08);
	}

	header {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 48px;
		padding: 0 14px;
		border-bottom: 1px solid var(--edge);
	}

	.title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 13px;
		font-weight: 600;
	}

	.tool,
	.close {
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: 16px;
		line-height: 1;
		cursor: pointer;
		padding: 3px 7px;
		border-radius: 6px;
	}

	.tool:hover,
	.close:hover {
		color: var(--fg);
		background: var(--surface-2);
	}

	textarea {
		flex: 1;
		margin: 10px 12px;
		padding: 12px 14px;
		border: 1px solid var(--edge);
		border-radius: 10px;
		background: var(--surface-2);
		color: var(--fg);
		font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace;
		font-size: 12.5px;
		line-height: 1.6;
		resize: none;
		outline: none;
		tab-size: 2;
	}

	textarea:focus {
		border-color: var(--accent);
	}

	@media (max-width: 640px) {
		.pane {
			top: auto;
			bottom: 0;
			left: 0;
			width: 100%;
			max-height: 72vh;
			border-right: none;
			border-top: 1px solid var(--edge);
			border-radius: 16px 16px 0 0;
			box-shadow: 0 -12px 32px rgb(0 0 0 / 0.18);
			padding-bottom: env(safe-area-inset-bottom);
		}

		.tool,
		.close {
			width: 40px;
			height: 40px;
		}
	}
</style>

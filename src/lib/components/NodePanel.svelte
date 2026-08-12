<script lang="ts">
	import { canvas } from '$lib/stores/canvas.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { findNode } from '$lib/utils/tree';
	import { normalizeUrl } from '$lib/utils/url';
	import EmojiPicker from './EmojiPicker.svelte';

	const COLOR_PRESETS: Array<{ name: string; value: string | null }> = [
		{ name: 'Default', value: null },
		{ name: 'Pastel Red', value: '#ef4444' },
		{ name: 'Pastel Green', value: '#22c55e' },
		{ name: 'Pastel Blue', value: '#3b82f6' },
		{ name: 'Pastel Yellow', value: '#eab308' },
		{ name: 'Pastel Purple', value: '#a855f7' }
	];

	const target = $derived.by(() => {
		const map = workspace.getActiveMap();
		const id = canvas.selectedNodeId;
		if (!map || !id) return null;
		return findNode(map.rootNode, id);
	});

	const visible = $derived(!!target && canvas.panelOpen);
	const reopenVisible = $derived(!!target && !canvas.panelOpen);

	let showEmoji = $state(false);
	let linkDraft = $state('');
	let notesDraft = $state('');
	let lastSelectedId: string | null = null;

	$effect(() => {
		notesDraft = target?.notes ?? '';
		const id = canvas.selectedNodeId;
		// On compact (touch/small) devices the panel opens manually.
		if (id && id !== lastSelectedId && !canvas.mdPaneOpen && !ui.isCompact) {
			lastSelectedId = id;
			canvas.panelOpen = true;
		}
	});

	// Split-view (.md) mode keeps the canvas clear on the right.
	$effect(() => {
		if (canvas.mdPaneOpen) canvas.panelOpen = false;
	});

	function setColor(value: string | null) {
		if (target) workspace.setNodeColor(target.id, value ?? '');
	}

	function addLink() {
		const url = linkDraft.trim();
		if (!url || !target) return;
		workspace.addNodeLink(target.id, url);
		linkDraft = '';
	}
</script>

{#if reopenVisible}
	<button
		type="button"
		class="reopen"
		title="Node settings"
		aria-label="Open node settings"
		onclick={() => (canvas.panelOpen = true)}
	>
		›
	</button>
{/if}

<div class="panel" class:open={visible} role="complementary" aria-label="Node settings" aria-hidden={!visible}>
	<div class="sheet-handle" aria-hidden="true"></div>
	{#if target}
		<header>
			<span class="title">{target.text || 'Node'}</span>
			<button
				type="button"
				class="close"
				aria-label="Close node settings"
				onclick={() => (canvas.panelOpen = false)}
			>
				&times;
			</button>
		</header>

		<div class="body">
			<section class="section">
				<span class="label">Color</span>
				<div class="colors">
					{#each COLOR_PRESETS as preset (preset.value ?? 'default')}
						<button
							type="button"
							class="dot"
							class:selected={target.style?.color === preset.value}
							style:--dot={preset.value ?? 'transparent'}
							title={preset.name}
							aria-label={preset.name}
							onclick={() => setColor(preset.value)}
						></button>
					{/each}
				</div>
			</section>

			<section class="section">
				<span class="label">Icon</span>
				<div class="icon-row">
					<span class="current-icon">{target.style?.icon ?? '–'}</span>
					<button
						type="button"
						class="mini-btn"
						class:open={showEmoji}
						onclick={() => (showEmoji = !showEmoji)}
					>
						{showEmoji ? 'Close picker' : 'Add / change emoji'}
					</button>
					{#if target.style?.icon}
						<button
							type="button"
							class="mini-btn"
							onclick={() => workspace.setNodeIcon(target!.id, '')}
						>
							Remove icon
						</button>
					{/if}
				</div>
				{#if showEmoji}
					<EmojiPicker
						current={target.style?.icon}
						onselect={(emoji) => {
							workspace.setNodeIcon(target!.id, emoji);
							showEmoji = false;
						}}
					/>
				{/if}
			</section>

			<section class="section">
				<span class="label">Hyperlinks</span>
				<form class="link-form" onsubmit={(e) => { e.preventDefault(); addLink(); }}>
					<input
						bind:value={linkDraft}
						type="text"
						placeholder="https://example.com"
						spellcheck="false"
					/>
					<button type="submit" class="add" disabled={!linkDraft.trim()}>Add</button>
				</form>
				{#if target.links?.length}
					<ul class="link-list">
						{#each target.links as link (link)}
							<li>
								<a href={normalizeUrl(link)} target="_blank" rel="noopener noreferrer">{link}</a>
								<button
									type="button"
									class="remove"
									aria-label="Remove link"
									onclick={() => workspace.removeNodeLink(target!.id, link)}
								>
									&times;
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<section class="section notes">
				<span class="label">Notes</span>
				<textarea
					bind:value={notesDraft}
					oninput={(e) => {
						notesDraft = e.currentTarget.value;
						workspace.setNodeNotes(target!.id, e.currentTarget.value);
					}}
					placeholder="Write notes&hellip;"
					spellcheck="false"
				></textarea>
			</section>
		</div>
	{/if}
</div>

<style>
	.panel {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: 320px;
		max-width: 100%;
		background: var(--surface);
		border-left: 1px solid var(--edge);
		box-shadow: -8px 0 24px rgb(0 0 0 / 0.08);
		z-index: 60;
		display: flex;
		flex-direction: column;
		transform: translateX(102%);
		transition: transform 0.18s ease;
	}

	.panel.open {
		transform: translateX(0);
	}

	.reopen {
		position: absolute;
		top: 50%;
		right: 0;
		transform: translateY(-50%);
		z-index: 55;
		width: 24px;
		height: 56px;
		border: 1px solid var(--edge);
		border-right: none;
		border-radius: 8px 0 0 8px;
		background: var(--surface);
		color: var(--muted);
		font-size: 16px;
		cursor: pointer;
		box-shadow: var(--node-shadow);
	}

	.reopen:hover {
		color: var(--fg);
		background: var(--surface-2);
	}

	.sheet-handle {
		display: none;
	}

	@media (max-width: 640px) {
		.panel {
			top: auto;
			bottom: 0;
			left: 0;
			right: 0;
			width: 100%;
			max-height: 72vh;
			border-left: none;
			border-top: 1px solid var(--edge);
			border-radius: 16px 16px 0 0;
			box-shadow: 0 -12px 32px rgb(0 0 0 / 0.18);
			transform: translateY(102%);
			padding-bottom: env(safe-area-inset-bottom);
		}

		.panel.open {
			transform: translateY(0);
		}

		.sheet-handle {
			display: block;
			width: 44px;
			height: 4px;
			border-radius: 9999px;
			background: var(--edge);
			margin: 8px auto 0;
			flex: none;
		}

		.reopen {
			top: auto;
			bottom: calc(env(safe-area-inset-bottom) + 56px);
			right: 12px;
			transform: none;
			width: 44px;
			height: 44px;
			border: 1px solid var(--edge);
			border-right: 1px solid var(--edge);
			border-radius: 9999px;
			font-size: 20px;
		}

		.close {
			width: 40px;
			height: 40px;
		}
	}

	header {
		display: flex;
		align-items: center;
		gap: 8px;
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

	.close {
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: 20px;
		line-height: 1;
		cursor: pointer;
		padding: 2px 6px;
		border-radius: 6px;
	}

	.close:hover {
		color: var(--fg);
		background: var(--surface-2);
	}

	.body {
		flex: 1;
		overflow-y: auto;
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
	}

	.colors {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.dot {
		width: 22px;
		height: 22px;
		border-radius: 9999px;
		border: 2px solid var(--edge);
		background: var(--dot);
		cursor: pointer;
		transition:
			transform 0.1s ease,
			border-color 0.1s ease;
	}

	.dot:hover {
		transform: scale(1.15);
		border-color: var(--muted);
	}

	.dot.selected {
		border-color: var(--fg);
	}

	.icon-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.current-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: 1px solid var(--edge);
		border-radius: 8px;
		background: var(--surface-2);
		font-size: 18px;
	}

	.mini-btn {
		padding: 6px 10px;
		border: 1px solid var(--edge);
		border-radius: 7px;
		background: transparent;
		color: var(--fg);
		font-size: 12px;
		cursor: pointer;
	}

	.mini-btn:hover {
		background: var(--surface-2);
	}

	.mini-btn.open {
		background: var(--surface-2);
	}

	.link-form {
		display: flex;
		gap: 6px;
	}

	.link-form input {
		flex: 1;
		min-width: 0;
		padding: 6px 10px;
		border-radius: 8px;
		border: 1px solid var(--edge);
		background: var(--surface-2);
		color: var(--fg);
		font-size: 12px;
		outline: none;
	}

	.link-form input:focus {
		border-color: var(--accent);
	}

	.add {
		padding: 6px 10px;
		border: none;
		border-radius: 8px;
		background: var(--accent);
		color: var(--accent-fg);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
	}

	.add:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.link-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.link-list li {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		padding: 4px 6px;
		border-radius: 6px;
		background: var(--surface-2);
	}

	.link-list li a {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--accent);
		text-decoration: none;
	}

	.link-list li a:hover {
		text-decoration: underline;
	}

	.remove {
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: 14px;
		cursor: pointer;
		line-height: 1;
		padding: 2px;
	}

	.remove:hover {
		color: var(--fg);
	}

	textarea {
		min-height: 120px;
		padding: 10px 12px;
		border: 1px solid var(--edge);
		border-radius: 8px;
		background: var(--surface-2);
		color: var(--fg);
		font-size: 13px;
		line-height: 1.6;
		resize: vertical;
		outline: none;
		font-family: inherit;
	}

	textarea:focus {
		border-color: var(--accent);
	}
</style>

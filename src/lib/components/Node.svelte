<script lang="ts">
	import { onMount } from 'svelte';
	import type { MindNode } from '$lib/types';
	import { canvas } from '$lib/stores/canvas.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { normalizeUrl } from '$lib/utils/url';
	import Node from './Node.svelte';

	let { node, depth }: { node: MindNode; depth: number } = $props();

	let el = $state<HTMLDivElement | null>(null);
	let textEl = $state<HTMLSpanElement | null>(null);
	let editing = $state(false);
	let startText = '';
	let lastX = 0;
	let lastY = 0;
	let moved = false;

	const selected = $derived(canvas.selectedNodeId === node.id);
	const color = $derived(node.style?.color);
	const icon = $derived(node.style?.icon);

	onMount(() => {
		if (!el) return;
		const report = () => {
			canvas.nodeSizes[node.id] = { w: el!.offsetWidth, h: el!.offsetHeight };
		};
		report();
		const ro = new ResizeObserver(report);
		ro.observe(el);
		return () => {
			ro.disconnect();
			delete canvas.nodeSizes[node.id];
		};
	});

	$effect(() => {
		if (canvas.editingNodeId === node.id) {
			if (editing) return;
			editing = true;
			startText = node.text;
			requestAnimationFrame(() => {
				if (textEl) {
					textEl.textContent = node.text;
					textEl.focus();
					placeCaretAtEnd(textEl);
				}
			});
		} else if (editing) {
			editing = false;
		}
	});

	function placeCaretAtEnd(element: HTMLElement) {
		const range = document.createRange();
		range.selectNodeContents(element);
		range.collapse(false);
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
	}

	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		if (canvas.editingNodeId === node.id) return;
		if (canvas.spaceDown) return;
		e.stopPropagation();
		canvas.selectNode(node.id);
		moved = false;
		lastX = e.clientX;
		lastY = e.clientY;
		el?.setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (el?.hasPointerCapture(e.pointerId) !== true) return;
		const dx = e.clientX - lastX;
		const dy = e.clientY - lastY;
		if (dx === 0 && dy === 0) return;
		if (!moved && Math.hypot(dx, dy) < 4) return; // small movement = still a click
		moved = true;
		workspace.setNodePosition(node.id, {
			x: node.position.x + dx / canvas.zoom,
			y: node.position.y + dy / canvas.zoom
		});
		lastX = e.clientX;
		lastY = e.clientY;
	}

	function onPointerUp(e: PointerEvent) {
		if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
		if (!moved && canvas.editingNodeId !== node.id) canvas.startEditing(node.id);
	}

	function onTextKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			if (e.shiftKey) return; // multiline: allow line break
			e.preventDefault();
			canvas.stopEditing();
			const sibling = workspace.createSibling(node.id);
			if (sibling) canvas.selectNode(sibling.id);
		} else if (e.key === 'Tab') {
			e.preventDefault();
			canvas.stopEditing();
			const child = workspace.createChild(node.id);
			if (child) canvas.selectNode(child.id);
		} else if (e.key === 'Escape') {
			e.preventDefault();
			workspace.updateNodeText(node.id, startText);
			canvas.stopEditing();
		}
	}
</script>

<div
	data-node
	bind:this={el}
	class="node"
	class:selected
	class:editing
	class:has-color={!!color}
	style:left="{node.position.x}px"
	style:top="{node.position.y}px"
	style:transform="translate(-50%, -50%)"
	style:--node-color={color}
	role="button"
	tabindex="-1"
	aria-label={node.text || 'Empty node'}
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
>
	{#if icon}
		<span class="node-icon">{icon}</span>
	{/if}
	{#if editing}
		<span
			bind:this={textEl}
			class="node-text"
			contenteditable="true"
			spellcheck="false"
			data-placeholder="New"
			role="textbox"
			tabindex="0"
			aria-label="Node text"
			oninput={(e) => workspace.updateNodeText(node.id, e.currentTarget.textContent ?? '')}
			onkeydown={onTextKeydown}
			onblur={() => canvas.stopEditing()}
			onpointerdown={(e) => e.stopPropagation()}
			onmousedown={(e) => e.stopPropagation()}
		></span>
	{:else}
		<span class="node-text" data-placeholder="New">{node.text}</span>
	{/if}
	{#if node.links?.length}
		<a
			class="node-link"
			href={normalizeUrl(node.links[0])}
			target="_blank"
			rel="noopener noreferrer"
			title={node.links[0]}
			aria-label="External link"
			onpointerdown={(e) => e.stopPropagation()}
			onpointerup={(e) => e.stopPropagation()}
			onmousedown={(e) => e.stopPropagation()}
			onclick={(e) => e.stopPropagation()}
		>
			🔗
		</a>
	{/if}
	{#if node.notes}
		<span class="node-note" title="Has notes" aria-label="Has notes">📝</span>
	{/if}
	<button
		type="button"
		class="node-add"
		tabindex="-1"
		title="Add child"
		aria-label="Add child"
		onpointerdown={(e) => e.stopPropagation()}
		onpointerup={(e) => e.stopPropagation()}
		onmousedown={(e) => e.stopPropagation()}
		onclick={(e) => {
			e.stopPropagation();
			const child = workspace.createChild(node.id);
			if (child) canvas.selectNode(child.id);
		}}
	>
		+
	</button>
</div>

{#each node.children as child (child.id)}
	<Node node={child} depth={depth + 1} />
{/each}

<style>
	.node {
		position: absolute;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 10px;
		background: var(--node-bg);
		border: 1.5px solid var(--node-edge);
		box-shadow: var(--node-shadow);
		color: var(--fg);
		cursor: grab;
		user-select: none;
		transition:
			box-shadow 0.12s ease,
			border-color 0.12s ease,
			background 0.12s ease;
	}

	.node:active {
		cursor: grabbing;
	}

	.node.editing {
		cursor: text;
		user-select: text;
	}

	.node.has-color {
		border-color: color-mix(in srgb, var(--node-color) 55%, var(--node-edge));
		background: color-mix(in srgb, var(--node-color) 7%, var(--node-bg));
	}

	.node.selected {
		border-color: var(--accent);
		box-shadow:
			0 0 0 2px var(--accent),
			0 4px 16px -4px rgb(0 0 0 / 0.28),
			var(--node-shadow);
		background: color-mix(in srgb, var(--accent) 12%, var(--node-bg));
	}

	.node-icon {
		font-size: 13px;
		line-height: 1;
	}

	.node-text {
		font-size: 13px;
		font-weight: 500;
		line-height: 1.4;
		min-width: 1ch;
		white-space: pre;
		outline: none;
	}

	.node-text:empty::before {
		content: attr(data-placeholder);
		color: var(--muted);
		font-weight: 400;
	}

	.node-link {
		font-size: 12px;
		color: var(--muted);
		opacity: 0.85;
		line-height: 1;
		text-decoration: none;
	}

	.node-link:hover {
		opacity: 1;
		color: var(--accent);
	}

	.node-note {
		font-size: 10px;
		line-height: 1;
		opacity: 0.7;
	}

	.node-add {
		position: absolute;
		right: -8px;
		bottom: -8px;
		z-index: 2;
		display: grid;
		place-items: center;
		box-sizing: border-box;
		width: 18px;
		height: 18px;
		padding: 0;
		border: 1px solid var(--node-edge);
		border-radius: 9999px;
		background: var(--surface);
		color: var(--accent);
		font-size: 14px;
		font-weight: 600;
		line-height: 1;
		cursor: pointer;
		box-shadow: var(--node-shadow);
		opacity: 0;
		transition:
			opacity 0.12s ease,
			transform 0.12s ease,
			background 0.12s ease;
	}

	.node:hover .node-add,
	.node.selected .node-add {
		opacity: 1;
	}

	.node-add:hover {
		background: var(--surface-2);
		transform: scale(1.1);
	}

	.node.editing .node-add {
		display: none;
	}

	@media (pointer: coarse) {
		.node-add {
			width: 26px;
			height: 26px;
			right: -13px;
			bottom: -13px;
			font-size: 16px;
		}
	}
</style>

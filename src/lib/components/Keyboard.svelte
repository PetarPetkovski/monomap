<script lang="ts">
	import { onMount } from 'svelte';
	import { canvas } from '$lib/stores/canvas.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { findParent, navigate } from '$lib/utils/tree';

	function isEditableTarget(e: Event) {
		const target = e.target as HTMLElement | null;
		return !!target?.closest('[contenteditable="true"], input, textarea, select');
	}

	let spaceTimer: ReturnType<typeof setTimeout> | undefined;

	function handleKeyDown(e: KeyboardEvent) {
		const mod = e.metaKey || e.ctrlKey;
		const key = e.key.toLowerCase();
		const editing = canvas.editingNodeId !== null;

		if (mod) {
			if (key === 't') {
				e.preventDefault();
				workspace.createMap();
				return;
			}
			if (key === 'w') {
				e.preventDefault();
				workspace.closeTab(workspace.activeTabId);
				return;
			}
			if (e.key === '\\') {
				e.preventDefault();
				canvas.sidebarOpen = !canvas.sidebarOpen;
				return;
			}
			if (key === 'm') {
				e.preventDefault();
				canvas.mdPaneOpen = !canvas.mdPaneOpen;
				return;
			}
			if (key === '0') {
				e.preventDefault();
				const root = workspace.getActiveMap()?.rootNode;
				if (root) canvas.centerOnNode(root);
				else canvas.resetView();
				return;
			}
			if (key === '+' || key === '=') {
				e.preventDefault();
				canvas.zoomBy(1.2);
				return;
			}
			if (key === '-') {
				e.preventDefault();
				canvas.zoomBy(1 / 1.2);
				return;
			}
		}

		// Space: quick tap edits the selected node, hold + drag pans.
		if (e.key === ' ') {
			if (editing || isEditableTarget(e)) return;
			e.preventDefault();
			canvas.spaceDown = true;
			if (!spaceTimer) {
				spaceTimer = setTimeout(() => {
					spaceTimer = undefined;
				}, 220);
			}
			return;
		}

		if (editing || isEditableTarget(e)) return;
		if (e.repeat) return;

		const selected = canvas.selectedNodeId;
		const root = workspace.getActiveMap()?.rootNode;
		if (!selected || !root) return;

		switch (e.key) {
			case 'Tab':
				e.preventDefault();
				{
					const child = workspace.createChild(selected);
					if (child) canvas.selectNode(child.id);
				}
				break;
			case 'Enter':
				e.preventDefault();
				{
					const sibling = workspace.createSibling(selected);
					if (sibling) canvas.selectNode(sibling.id);
				}
				break;
			case 'Delete':
			case 'Backspace':
				e.preventDefault();
				{
					if (selected === root.id) return;
					const parentId = findParent(root, selected)?.parent.id ?? root.id;
					workspace.deleteNode(selected);
					canvas.selectNode(parentId);
				}
				break;
			case 'ArrowUp':
			case 'ArrowDown':
			case 'ArrowLeft':
			case 'ArrowRight':
				e.preventDefault();
				{
					const dir = e.key.toLowerCase().replace('arrow', '') as 'up' | 'down' | 'left' | 'right';
					const target = navigate(root, selected, dir);
					if (target) canvas.selectNode(target);
				}
				break;
			case 'Escape':
				e.preventDefault();
				canvas.clearSelection();
				break;
		}
	}

	function handleKeyUp(e: KeyboardEvent) {
		if (e.key !== ' ') return;
		canvas.spaceDown = false;
		if (spaceTimer) {
			clearTimeout(spaceTimer);
			spaceTimer = undefined;
			const selected = canvas.selectedNodeId;
			if (selected) canvas.startEditing(selected);
		}
	}
</script>

<svelte:window
	onkeydown={handleKeyDown}
	onkeyup={handleKeyUp}
	onblur={() => {
		canvas.spaceDown = false;
		if (spaceTimer) {
			clearTimeout(spaceTimer);
			spaceTimer = undefined;
		}
	}}
/>

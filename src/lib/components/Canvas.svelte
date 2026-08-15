<script lang="ts">
	import { onMount } from 'svelte';
	import Node from './Node.svelte';
	import ConnectionLayer from './ConnectionLayer.svelte';
	import { canvas, clampZoom } from '$lib/stores/canvas.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { findNode } from '$lib/utils/tree';

	const GRID_SPACING = 26;
	const GRID_DOT = 'color-mix(in srgb, var(--fg) 7%, transparent)';

	let container = $state<HTMLDivElement | null>(null);
	let panning = $state(false);
	let lastX = 0;
	let lastY = 0;

	const touchPoints = new Map<number, { x: number; y: number }>();
	let pinchStart: {
		dist: number;
		zoom: number;
		x: number;
		y: number;
		mid: { x: number; y: number };
	} | null = null;

	const root = $derived(workspace.getActiveMap()?.rootNode ?? null);

	const gridStyle = $derived.by(() => {
		if (!settings.gridEnabled) return '';
		const size = GRID_SPACING * canvas.zoom;
		if (size <= 0) return '';
		const px = ((canvas.x % size) + size) % size;
		const py = ((canvas.y % size) + size) % size;
		return `background-image: radial-gradient(circle, ${GRID_DOT} 1.2px, transparent 1.3px); background-size: ${size}px ${size}px; background-position: ${px}px ${py}px;`;
	});

	$effect(() => {
		const map = workspace.getActiveMap();
		if (map) {
			const selected = canvas.selectedNodeId;
			if (!selected || !findNode(map.rootNode, selected)) canvas.selectNode(map.rootNode.id);
		}
	});

	// Center on a node requested while the canvas was hidden (e.g. jumping from a
	// kanban card link) once the viewport has a real size.
	$effect(() => {
		const id = canvas.pendingCenterId;
		if (!id) return;
		const map = workspace.getActiveMap();
		const node = map && findNode(map.rootNode, id);
		if (!node) return;
		if (canvas.viewport.width === 0 || canvas.viewport.height === 0) return;
		canvas.centerOnNode(node);
		canvas.selectNode(id);
		canvas.pendingCenterId = null;
	});

	onMount(() => {
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(container!);
		requestAnimationFrame(() => canvas.resetView());
		return () => ro.disconnect();
	});

	function measure() {
		if (container) canvas.viewport = { width: container.clientWidth, height: container.clientHeight };
	}

	function startPan(e: PointerEvent) {
		panning = true;
		lastX = e.clientX;
		lastY = e.clientY;
		container?.setPointerCapture(e.pointerId);
	}

	function beginPinch() {
		const points = [...touchPoints.values()];
		if (points.length < 2) return;
		pinchStart = {
			dist: distance(points[0], points[1]),
			zoom: canvas.zoom,
			x: canvas.x,
			y: canvas.y,
			mid: midpoint(points[0], points[1])
		};
	}

	function updatePinch() {
		const points = [...touchPoints.values()];
		if (!pinchStart || points.length < 2) return;
		const dist = distance(points[0], points[1]);
		const mid = midpoint(points[0], points[1]);
		if (pinchStart.dist <= 0) return;
		const targetZoom = clampZoom(pinchStart.zoom * (dist / pinchStart.dist));
		// Keep the world point under the gesture's start midpoint pinned to the new midpoint.
		const wx = (pinchStart.mid.x - pinchStart.x) / pinchStart.zoom;
		const wy = (pinchStart.mid.y - pinchStart.y) / pinchStart.zoom;
		canvas.x = mid.x - wx * targetZoom;
		canvas.y = mid.y - wy * targetZoom;
		canvas.zoom = targetZoom;
	}

	function onPointerDown(e: PointerEvent) {
		if (e.pointerType === 'touch') {
			e.preventDefault();
			touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
			if (touchPoints.size === 2) {
				panning = false;
				beginPinch();
				return;
			}
			if (touchPoints.size === 1) {
				canvas.clearSelection();
				panning = true;
				lastX = e.clientX;
				lastY = e.clientY;
				container?.setPointerCapture(e.pointerId);
			}
			return;
		}
		if (e.button === 1) {
			e.preventDefault();
			startPan(e);
			return;
		}
		if (e.button === 0 && canvas.spaceDown) {
			startPan(e);
			return;
		}
		if (e.button === 0) {
			canvas.clearSelection();
		}
	}

	function onPointerMove(e: PointerEvent) {
		if (e.pointerType === 'touch') {
			const point = touchPoints.get(e.pointerId);
			if (!point) return;
			point.x = e.clientX;
			point.y = e.clientY;
			if (touchPoints.size >= 2 && pinchStart) {
				updatePinch();
				return;
			}
			if (panning) {
				canvas.panBy(e.clientX - lastX, e.clientY - lastY);
				lastX = e.clientX;
				lastY = e.clientY;
			}
			return;
		}
		if (!panning) return;
		canvas.panBy(e.clientX - lastX, e.clientY - lastY);
		lastX = e.clientX;
		lastY = e.clientY;
	}

	function onPointerUp(e: PointerEvent) {
		if (e.pointerType === 'touch') {
			touchPoints.delete(e.pointerId);
			if (pinchStart && touchPoints.size < 2) pinchStart = null;
			if (touchPoints.size === 1) {
				// Keep panning with the remaining finger.
				const [point] = [...touchPoints.values()];
				panning = true;
				lastX = point.x;
				lastY = point.y;
			} else if (touchPoints.size === 0) {
				panning = false;
				if (container?.hasPointerCapture(e.pointerId)) container.releasePointerCapture(e.pointerId);
			}
			return;
		}
		if (!panning) return;
		panning = false;
		if (container?.hasPointerCapture(e.pointerId)) container.releasePointerCapture(e.pointerId);
	}

	function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
		return Math.hypot(a.x - b.x, a.y - b.y);
	}

	function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
		return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		if (e.ctrlKey || e.metaKey) {
			const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
			canvas.zoomAt(e.clientX, e.clientY, factor);
		} else {
			canvas.panBy(-e.deltaX, -e.deltaY);
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	bind:this={container}
	class="canvas-root relative h-full w-full overflow-hidden touch-none"
	class:cursor-grab={canvas.spaceDown}
	class:cursor-grabbing={panning}
	style={gridStyle}
	role="application"
	aria-label="Mind map canvas"
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
	onwheel={onWheel}
	onmousedown={(e) => {
		if (e.button === 1) e.preventDefault();
	}}
	oncontextmenu={(e) => e.preventDefault()}
>
	{#if root}
		<div
			data-world
			class="absolute left-0 top-0 origin-top-left"
			style="transform: translate({canvas.x}px, {canvas.y}px) scale({canvas.zoom})"
		>
			<ConnectionLayer {root} />
			<Node node={root} depth={0} />
		</div>
	{/if}
</div>

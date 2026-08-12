<script lang="ts">
	import type { MindNode } from '$lib/types';
	import { canvas } from '$lib/stores/canvas.svelte';
	import { calculateBezierPath } from '$lib/utils/bezier';
	import { forEachNode, getEdges } from '$lib/utils/tree';

	let { root }: { root: MindNode } = $props();

	const edges = $derived(getEdges(root));

	const bounds = $derived.by(() => {
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		forEachNode(root, (node) => {
			const size = canvas.nodeSizes[node.id];
			const w = size?.w ?? 0;
			const h = size?.h ?? 0;
			minX = Math.min(minX, node.position.x - w / 2);
			minY = Math.min(minY, node.position.y - h / 2);
			maxX = Math.max(maxX, node.position.x + w / 2);
			maxY = Math.max(maxY, node.position.y + h / 2);
		});
		if (!Number.isFinite(minX)) return null;
		const pad = 80;
		return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
	});

	const paths = $derived(
		edges.map(({ parent, child }) => {
			const pSize = canvas.nodeSizes[parent.id];
			const cSize = canvas.nodeSizes[child.id];
			const pW = pSize?.w ?? 0;
			const cW = cSize?.w ?? 0;
			const sx = parent.position.x + pW / 2;
			const sy = parent.position.y;
			const ex = child.position.x - cW / 2;
			const ey = child.position.y;
			return {
				id: child.id,
				d: calculateBezierPath(sx, sy, ex, ey),
				color: child.style?.color
			};
		})
	);
</script>

{#if bounds}
	<svg
		class="layer pointer-events-none absolute"
		style:left="{bounds.x}px"
		style:top="{bounds.y}px"
		style:width="{bounds.w}px"
		style:height="{bounds.h}px"
		viewBox="{bounds.x} {bounds.y} {bounds.w} {bounds.h}"
		aria-hidden="true"
	>
		{#each paths as p (p.id)}
			<path
				d={p.d}
				stroke={p.color ? `color-mix(in srgb, ${p.color} 75%, var(--edge))` : 'var(--edge)'}
				stroke-width="2"
				stroke-linecap="round"
				fill="none"
			/>
		{/each}
	</svg>
{/if}

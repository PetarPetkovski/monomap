import type { MindNode } from '$lib/types';

export interface Bounds {
	x: number;
	y: number;
	w: number;
	h: number;
}

export function getContentBounds(
	root: MindNode,
	sizes: Record<string, { w: number; h: number }>
): Bounds {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	const walk = (node: MindNode) => {
		const size = sizes[node.id] ?? { w: 120, h: 40 };
		minX = Math.min(minX, node.position.x - size.w / 2);
		minY = Math.min(minY, node.position.y - size.h / 2);
		maxX = Math.max(maxX, node.position.x + size.w / 2);
		maxY = Math.max(maxY, node.position.y + size.h / 2);
		for (const child of node.children) walk(child);
	};
	walk(root);

	return {
		x: minX,
		y: minY,
		w: maxX - minX,
		h: maxY - minY
	};
}

import type { MindNode, Vec2 } from '$lib/types';
import { nodeId } from '$lib/utils/id';

export function findNode(root: MindNode, id: string): MindNode | null {
	if (root.id === id) return root;
	for (const child of root.children) {
		const found = findNode(child, id);
		if (found) return found;
	}
	return null;
}

export function findParent(
	root: MindNode,
	id: string
): { parent: MindNode; child: MindNode } | null {
	if (root.id === id) return null;
	for (const child of root.children) {
		if (child.id === id) return { parent: root, child };
		const found = findParent(child, id);
		if (found) return found;
	}
	return null;
}

export function forEachNode(root: MindNode, fn: (node: MindNode, depth: number) => void): void {
	fn(root, 0);
	for (const child of root.children) {
		forEachNode(child, (node, depth) => fn(node, depth + 1));
	}
}

export function countNodes(root: MindNode): number {
	let count = 1;
	for (const child of root.children) {
		count += countNodes(child);
	}
	return count;
}

export function insertChild(parent: MindNode, child: MindNode, index = parent.children.length): void {
	parent.children.splice(index, 0, child);
}

export function removeChild(parent: MindNode, childId: string): MindNode | null {
	const index = parent.children.findIndex((c) => c.id === childId);
	if (index === -1) return null;
	const [removed] = parent.children.splice(index, 1);
	return removed;
}

export function cloneTree(root: MindNode): MindNode {
	const { children, ...rest } = root;
	return { ...rest, id: nodeId(), children: children.map(cloneTree) };
}

export function subtreeAt(root: MindNode, id: string): MindNode[] {
	const nodes: MindNode[] = [];
	const target = findNode(root, id);
	if (target) forEachNode(target, (node) => nodes.push(node));
	return nodes;
}

export function childPositions(parent: MindNode, spacing = 56): Vec2 {
	const count = parent.children.length;
	return { x: parent.position.x + 240, y: parent.position.y + count * spacing };
}

export interface Edge {
	parent: MindNode;
	child: MindNode;
}

export function getEdges(root: MindNode): Edge[] {
	const edges: Edge[] = [];
	const walk = (node: MindNode) => {
		for (const child of node.children) {
			edges.push({ parent: node, child });
			walk(child);
		}
	};
	walk(root);
	return edges;
}

export type NavDirection = 'up' | 'down' | 'left' | 'right';

export function navigate(root: MindNode, currentId: string, dir: NavDirection): string | null {
	if (dir === 'right') {
		const node = findNode(root, currentId);
		return node?.children[0]?.id ?? null;
	}
	if (dir === 'left') {
		return findParent(root, currentId)?.parent.id ?? null;
	}
	const order: MindNode[] = [];
	forEachNode(root, (node) => order.push(node));
	const index = order.findIndex((node) => node.id === currentId);
	if (index === -1) return null;
	const step = dir === 'down' ? 1 : -1;
	return order[index + step]?.id ?? null;
}

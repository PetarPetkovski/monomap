import { describe, expect, it } from 'vitest';
import type { MindNode } from '$lib/types';
import {
	childPositions,
	cloneTree,
	countNodes,
	findNode,
	findParent,
	forEachNode,
	getEdges,
	insertChild,
	navigate,
	removeChild
} from '$lib/utils/tree';

function node(id: string, children: MindNode[] = []): MindNode {
	return { id, text: id, position: { x: 0, y: 0 }, children };
}

const tree: MindNode = node('root', [
	node('a', [node('a1'), node('a2')]),
	node('b', [node('b1')]),
	node('c')
]);

describe('findNode', () => {
	it('finds nodes at any depth', () => {
		expect(findNode(tree, 'root')?.id).toBe('root');
		expect(findNode(tree, 'a1')?.id).toBe('a1');
		expect(findNode(tree, 'c')?.id).toBe('c');
	});

	it('returns null for missing ids', () => {
		expect(findNode(tree, 'zzz')).toBeNull();
	});
});

describe('findParent', () => {
	it('returns parent and child for nested nodes', () => {
		const found = findParent(tree, 'a1');
		expect(found?.parent.id).toBe('a');
		expect(found?.child.id).toBe('a1');
	});

	it('returns null for root or missing nodes', () => {
		expect(findParent(tree, 'root')).toBeNull();
		expect(findParent(tree, 'zzz')).toBeNull();
	});
});

describe('countNodes', () => {
	it('counts the whole subtree', () => {
		expect(countNodes(tree)).toBe(7);
		expect(countNodes(tree.children[0])).toBe(3);
	});
});

describe('forEachNode', () => {
	it('visits every node in depth-first order', () => {
		const ids: string[] = [];
		forEachNode(tree, (n) => ids.push(n.id));
		expect(ids).toEqual(['root', 'a', 'a1', 'a2', 'b', 'b1', 'c']);
	});
});

describe('insertChild / removeChild', () => {
	it('inserts and removes children', () => {
		const parent = node('p');
		const child = node('x');
		insertChild(parent, child);
		expect(parent.children.map((c) => c.id)).toEqual(['x']);
		const removed = removeChild(parent, 'x');
		expect(removed?.id).toBe('x');
		expect(parent.children).toHaveLength(0);
	});

	it('returns null when removing a missing child', () => {
		expect(removeChild(tree, 'zzz')).toBeNull();
	});
});

describe('cloneTree', () => {
	it('deep clones with fresh ids', () => {
		const copy = cloneTree(tree);
		expect(copy).not.toBe(tree);
		expect(copy.id).not.toBe(tree.id);
		expect(countNodes(copy)).toBe(countNodes(tree));
		const ids = new Set<string>();
		const walk = (n: MindNode) => {
			ids.add(n.id);
			n.children.forEach(walk);
		};
		walk(copy);
		expect(ids.size).toBe(7);
	});
});

describe('childPositions', () => {
	it('offsets children to the right and down', () => {
		const parent = node('p');
		parent.position = { x: 10, y: 20 };
		const first = childPositions(parent);
		expect(first).toEqual({ x: 250, y: 20 });
		parent.children.push(node('c1'), node('c2'));
		const third = childPositions(parent);
		expect(third).toEqual({ x: 250, y: 132 });
	});
});

describe('getEdges', () => {
	it('returns all parent-child pairs in depth-first order', () => {
		const edges = getEdges(tree);
		expect(edges.map((e) => `${e.parent.id}->${e.child.id}`)).toEqual([
			'root->a',
			'a->a1',
			'a->a2',
			'root->b',
			'b->b1',
			'root->c'
		]);
	});
});

describe('navigate', () => {
	// DFS order: root, a, a1, a2, b, b1, c
	it('moves right into the first child', () => {
		expect(navigate(tree, 'root', 'right')).toBe('a');
		expect(navigate(tree, 'a1', 'right')).toBeNull();
	});

	it('moves left to the parent', () => {
		expect(navigate(tree, 'a1', 'left')).toBe('a');
		expect(navigate(tree, 'root', 'left')).toBeNull();
	});

	it('moves down/up through the flattened tree', () => {
		expect(navigate(tree, 'a1', 'down')).toBe('a2');
		expect(navigate(tree, 'a2', 'down')).toBe('b');
		expect(navigate(tree, 'b1', 'up')).toBe('b');
		expect(navigate(tree, 'root', 'up')).toBeNull();
		expect(navigate(tree, 'c', 'down')).toBeNull();
	});

	it('returns null for missing nodes', () => {
		expect(navigate(tree, 'zzz', 'down')).toBeNull();
	});
});

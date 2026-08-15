import { describe, expect, it } from 'vitest';
import type { MapData } from '$lib/types';
import { getContentBounds } from './bounds';
import { autoSortTree, layoutTree, mapToMarkdown, parseMarkdownTree, sortTree } from './treeExport';

function mapWith(children: unknown[]): MapData {
	return {
		id: 'm',
		folderId: null,
		title: 'Untitled Map',
		createdAt: 0,
		updatedAt: 0,
		rootNode: { id: 'root', text: 'Core', position: { x: 0, y: 0 }, children: children as never }
	};
}

describe('mapToMarkdown', () => {
	it('serializes a tree as a nested outline', () => {
		const map = mapWith([
			{
				id: 'a',
				text: 'Child',
				position: { x: 0, y: 0 },
				children: [{ id: 'a1', text: 'Grandchild', position: { x: 0, y: 0 }, children: [] }]
			},
			{ id: 'b', text: 'Sibling', position: { x: 0, y: 0 }, children: [] }
		]);
		expect(mapToMarkdown(map)).toBe('# Core\n- Child\n  - Grandchild\n- Sibling\n');
	});
});

describe('parseMarkdownTree', () => {
	it('parses a heading with nested bullets', () => {
		const root = parseMarkdownTree('# Title\n- one\n  - detail\n- two');
		expect(root.text).toBe('Title');
		expect(root.children.map((c) => c.text)).toEqual(['one', 'two']);
		expect(root.children[0].children.map((c) => c.text)).toEqual(['detail']);
	});

	it('round-trips an exported outline', () => {
		const map = mapWith([
			{ id: 'a', text: 'Child', position: { x: 0, y: 0 }, children: [] }
		]);
		const root = parseMarkdownTree(mapToMarkdown(map));
		expect(root.text).toBe('Core');
		expect(root.children[0].text).toBe('Child');
	});

	it('imports plain text lines as sibling nodes', () => {
		const root = parseMarkdownTree('alpha\nbeta');
		expect(root.text).toBe('Imported');
		expect(root.children.map((c) => c.text)).toEqual(['alpha', 'beta']);
	});

	it('builds hierarchy from headings while skipping paragraphs', () => {
		const root = parseMarkdownTree('# T\nintro paragraph\n## A\ndetails\n### A1\nmore\n## B');
		expect(root.text).toBe('T');
		expect(root.children.map((c) => c.text)).toEqual(['A', 'B']);
		expect(root.children[0].children.map((c) => c.text)).toEqual(['A1']);
	});

	it('keeps list items when paragraphs are interleaved', () => {
		const root = parseMarkdownTree('# T\nparagraph\n- one\nparagraph\n  - detail\n- two');
		expect(root.children.map((c) => c.text)).toEqual(['one', 'two']);
		expect(root.children[0].children.map((c) => c.text)).toEqual(['detail']);
	});

	it('supports numbered lists', () => {
		const root = parseMarkdownTree('1. one\n2. two');
		expect(root.children.map((c) => c.text)).toEqual(['one', 'two']);
	});

	it('handles empty input', () => {
		const root = parseMarkdownTree('   \n\n');
		expect(root.text).toBe('Imported');
		expect(root.children).toHaveLength(0);
	});

	it('assigns ids to every node', () => {
		const root = parseMarkdownTree('# A\n- b\n  - c');
		const ids = new Set<string>();
		const walk = (n: typeof root) => {
			ids.add(n.id);
			n.children.forEach(walk);
		};
		walk(root);
		expect(ids.size).toBe(3);
	});
});

describe('layoutTree', () => {
	it('spreads children to the right of the parent', () => {
		const root = parseMarkdownTree('# A\n- b\n- c\n- d');
		layoutTree(root);
		expect(root.children).toHaveLength(3);
		for (const child of root.children) {
			expect(child.position.x).toBe(240);
		}
		expect(root.children[0].position.y).toBe(-56);
		expect(root.children[1].position.y).toBe(0);
		expect(root.children[2].position.y).toBe(56);
	});
});

describe('sortTree', () => {
	it('sorts children alphabetically, case-insensitively, recursively', () => {
		const root = parseMarkdownTree('# A\n- banana\n- Apple\n  - zebra\n  - mango');
		sortTree(root);
		expect(root.children.map((c) => c.text)).toEqual(['Apple', 'banana']);
		expect(root.children[0].children.map((c) => c.text)).toEqual(['mango', 'zebra']);
	});
});

describe('autoSortTree', () => {
	it('lays out leaves in stacked slots with parents centered', () => {
		const root = parseMarkdownTree('# A\n- b\n- c\n- d');
		autoSortTree(root);
		expect(root.position).toEqual({ x: 0, y: 56 });
		expect(root.children.map((c) => c.position.x)).toEqual([240, 240, 240]);
		expect(root.children.map((c) => c.position.y)).toEqual([0, 56, 112]);
	});

	it('produces a non-overlapping tidy layout', () => {
		const root = parseMarkdownTree('# A\n- b\n  - b1\n  - b2\n- c');
		autoSortTree(root);
		const positions: Array<[number, number]> = [];
		const walk = (n: typeof root) => {
			positions.push([n.position.x, n.position.y]);
			n.children.forEach(walk);
		};
		walk(root);
		// every distinct y is unique (no overlaps on the vertical axis)
		const ys = positions.map((p) => p[1]);
		expect(new Set(ys).size).toBe(ys.length);
	});
});

describe('getContentBounds', () => {
	it('computes the bounding box from node sizes', () => {
		const root = {
			id: 'root',
			text: '',
			position: { x: 0, y: 0 },
			children: [
				{ id: 'c', text: '', position: { x: 240, y: 0 }, children: [] }
			]
		};
		const sizes = { root: { w: 100, h: 40 }, c: { w: 80, h: 30 } };
		const bounds = getContentBounds(root as never, sizes);
		expect(bounds).toEqual({ x: -50, y: -20, w: 330, h: 40 });
	});
});

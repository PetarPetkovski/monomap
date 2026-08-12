import { describe, expect, it } from 'vitest';
import type { MindNode } from '$lib/types';
import { mergeTree, outlineFromTree, parseOutline } from './mdSync';

function node(id: string, text: string, overrides: Partial<MindNode> = {}): MindNode {
	return {
		id,
		text,
		position: { x: 0, y: 0 },
		children: [],
		...overrides
	};
}

describe('outlineFromTree', () => {
	it('serializes a tree as a nested outline', () => {
		const root = node('root', 'Core', {
			children: [
				node('a', 'Child', { children: [node('a1', 'Grandchild')] }),
				node('b', 'Sibling')
			]
		});
		expect(outlineFromTree(root)).toBe('# Core\n- Child\n  - Grandchild\n- Sibling');
	});

	it('flattens multiline text into the outline', () => {
		const root = node('root', 'A', { children: [node('a', 'line one\nline two')] });
		expect(outlineFromTree(root)).toBe('# A\n- line one line two');
	});
});

describe('parseOutline', () => {
	it('returns an empty root for blank input', () => {
		const root = parseOutline('   \n');
		expect(root.text).toBe('');
		expect(root.children).toHaveLength(0);
	});

	it('keeps empty marker lines as placeholder nodes', () => {
		const root = parseOutline('# A\n- ');
		expect(root.children).toHaveLength(1);
		expect(root.children[0].text).toBe('');
	});
});

describe('mergeTree', () => {
	it('preserves id, position, style and notes for untouched nodes', () => {
		const oldRoot = node('root', 'Core', {
			position: { x: 10, y: 20 },
			children: [
				node('a', 'Child', {
					position: { x: 250, y: 50 },
					style: { color: '#ef4444', icon: '🚀' },
					notes: 'hello'
				})
			]
		});
		const merged = mergeTree(oldRoot, parseOutline('# Core\n- Child'));
		expect(merged.id).toBe('root');
		expect(merged.position).toEqual({ x: 10, y: 20 });
		expect(merged.children[0].id).toBe('a');
		expect(merged.children[0].position).toEqual({ x: 250, y: 50 });
		expect(merged.children[0].style).toEqual({ color: '#ef4444', icon: '🚀' });
		expect(merged.children[0].notes).toBe('hello');
	});

	it('renames a single child while preserving its identity', () => {
		const oldRoot = node('root', 'Core', {
			children: [node('a', 'Old', { position: { x: 250, y: 50 } })]
		});
		const merged = mergeTree(oldRoot, parseOutline('# Core\n- New name'));
		expect(merged.children).toHaveLength(1);
		expect(merged.children[0].id).toBe('a');
		expect(merged.children[0].text).toBe('New name');
		expect(merged.children[0].position).toEqual({ x: 250, y: 50 });
	});

	it('inserts new nodes without disturbing existing ones', () => {
		const oldRoot = node('root', 'Core', {
			children: [node('a', 'A'), node('c', 'C', { position: { x: 240, y: 112 } })]
		});
		const merged = mergeTree(oldRoot, parseOutline('# Core\n- A\n- B\n- C'));
		expect(merged.children.map((c) => c.text)).toEqual(['A', 'B', 'C']);
		expect(merged.children[0].id).toBe('a');
		expect(merged.children[2].id).toBe('c');
		expect(merged.children[2].position).toEqual({ x: 240, y: 112 });
		expect(merged.children[1].id).not.toBe('a');
		expect(merged.children[1].id).not.toBe('c');
	});

	it('removes nodes that disappear from the outline', () => {
		const oldRoot = node('root', 'Core', {
			children: [node('a', 'A'), node('b', 'B'), node('c', 'C')]
		});
		const merged = mergeTree(oldRoot, parseOutline('# Core\n- A\n- C'));
		expect(merged.children.map((c) => c.text)).toEqual(['A', 'C']);
	});

	it('handles sibling reordering via LCS', () => {
		const oldRoot = node('root', 'Core', {
			children: [
				node('a', 'A', { position: { x: 240, y: 0 } }),
				node('b', 'B', { position: { x: 240, y: 56 } })
			]
		});
		const merged = mergeTree(oldRoot, parseOutline('# Core\n- B\n- A'));
		expect(merged.children.map((c) => c.text)).toEqual(['B', 'A']);
		expect(merged.children[0].id).toBe('b');
		expect(merged.children[0].position).toEqual({ x: 240, y: 56 });
		expect(merged.children[1].id).toBe('a');
	});

	it('clears the root text for an empty outline but keeps the root identity', () => {
		const oldRoot = node('root', 'Core', { position: { x: 10, y: 10 } });
		const merged = mergeTree(oldRoot, parseOutline(''));
		expect(merged.id).toBe('root');
		expect(merged.text).toBe('');
		expect(merged.position).toEqual({ x: 10, y: 10 });
	});

	it('keeps multiline text when the outline only flattens it', () => {
		const oldRoot = node('root', 'Core', {
			children: [node('a', 'line one\nline two')]
		});
		const merged = mergeTree(oldRoot, parseOutline('# Core\n- line one line two'));
		expect(merged.children[0].text).toBe('line one\nline two');
	});
});

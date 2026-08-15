import { describe, expect, it } from 'vitest';
import { cardDropTarget, columnInsertIndex, type DropColumn } from './kanbanDrop';

function col(id: string, x: number, w: number, cards: Array<{ id: string; y: number; h: number }>): DropColumn {
	return {
		id,
		rect: { left: x, right: x + w, top: 0, bottom: 1000, width: w, height: 1000 },
		cards: cards.map((c) => ({
			id: c.id,
			rect: { left: x, right: x + w, top: c.y, bottom: c.y + c.h, width: w, height: c.h }
		}))
	};
}

const columns = [
	col('c1', 0, 280, [
		{ id: 'a', y: 10, h: 60 },
		{ id: 'b', y: 80, h: 60 }
	]),
	col('c2', 300, 280, [{ id: 'c', y: 10, h: 60 }])
];

describe('cardDropTarget', () => {
	it('targets the column under the pointer', () => {
		const t = cardDropTarget(columns, 350, 100, null);
		expect(t.columnId).toBe('c2');
	});

	it('computes insertion index from card midpoints', () => {
		// Above card b (mid y=110) → index 1 in c1
		const t1 = cardDropTarget(columns, 100, 105, null);
		expect(t1.columnId).toBe('c1');
		expect(t1.index).toBe(1);
		// Below card b → index 2
		const t2 = cardDropTarget(columns, 100, 150, null);
		expect(t2.index).toBe(2);
	});

	it('excludes the dragged card when targeting its source column', () => {
		const t = cardDropTarget(columns, 100, 105, 'a');
		// Card a excluded, only b counted; b mid y=110, pointer 105 above → index 0
		expect(t.columnId).toBe('c1');
		expect(t.index).toBe(0);
	});

	it('falls back to the nearest column when between columns', () => {
		const t = cardDropTarget(columns, 290, 100, null);
		expect(t.columnId).toBe('c1');
	});

	it('skips hidden cards with a zero-size rect', () => {
		const withHidden = [
			col('c1', 0, 280, [
				{ id: 'a', y: 10, h: 60 },
				{ id: 'b', y: 0, h: 0 },
				{ id: 'c', y: 0, h: 0 }
			]),
			col('c2', 300, 280, [{ id: 'd', y: 10, h: 60 }])
		];
		const t = cardDropTarget(withHidden, 100, 90, null);
		// Only visible card a (mid y=40) counted → index 1
		expect(t.columnId).toBe('c1');
		expect(t.index).toBe(1);
	});
});

describe('columnInsertIndex', () => {
	it('returns the insert index by column midpoints', () => {
		// c2 mid = 440; pointer left of it → 1 (insert before c2)
		expect(columnInsertIndex(columns, 400)).toBe(1);
		// past c2 mid → 2 (insert after c2)
		expect(columnInsertIndex(columns, 500)).toBe(2);
		// far left → 0
		expect(columnInsertIndex(columns, 0)).toBe(0);
	});
});

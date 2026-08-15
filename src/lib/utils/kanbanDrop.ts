export interface Rect {
	left: number;
	right: number;
	top: number;
	bottom: number;
	width: number;
	height: number;
}

export interface DropColumn {
	id: string;
	rect: Rect;
	cards: DropCard[];
}

export interface DropCard {
	id: string;
	rect: Rect;
}

export interface CardDropTarget {
	columnId: string;
	index: number;
}

function nearestColumnIndex(columns: DropColumn[], x: number): number {
	if (columns.length === 0) return 0;
	for (let i = 0; i < columns.length; i++) {
		const c = columns[i];
		if (x >= c.rect.left && x <= c.rect.right) return i;
	}
	let best = 0;
	let bestDist = Infinity;
	for (let i = 0; i < columns.length; i++) {
		const c = columns[i];
		const mid = c.rect.left + c.rect.width / 2;
		const d = Math.abs(x - mid);
		if (d < bestDist) {
			bestDist = d;
			best = i;
		}
	}
	return best;
}

export function columnInsertIndex(columns: DropColumn[], x: number): number {
	let index = 0;
	for (const c of columns) {
		const mid = c.rect.left + c.rect.width / 2;
		if (x > mid) index++;
	}
	return index;
}

export function cardDropTarget(
	columns: DropColumn[],
	x: number,
	y: number,
	excludeCardId: string | null
): CardDropTarget {
	const col = columns[nearestColumnIndex(columns, x)];
	if (!col) return { columnId: '', index: 0 };
	let index = 0;
	for (const card of col.cards) {
		if (card.id === excludeCardId) continue;
		// Hidden (filtered-out) cards have a zero-size rect — skip them.
		if (card.rect.height <= 0 || card.rect.width <= 0) continue;
		const mid = card.rect.top + card.rect.height / 2;
		if (y > mid) index++;
	}
	return { columnId: col.id, index };
}

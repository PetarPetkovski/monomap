import type { KanbanCard } from '$lib/types';

export function cardMatches(card: KanbanCard, query: string): boolean {
	const q = query.trim().toLowerCase();
	if (!q) return true;
	const parts = [
		card.title,
		card.description ?? '',
		...(card.labels ?? []).flatMap((l) => [l.text, l.color]),
		...(card.checklist ?? []).map((i) => i.text)
	];
	return parts.join('\n').toLowerCase().includes(q);
}

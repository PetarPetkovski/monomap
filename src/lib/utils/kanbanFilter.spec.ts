import { describe, expect, it } from 'vitest';
import type { KanbanCard } from '$lib/types';
import { cardMatches } from './kanbanFilter';

function card(partial: Partial<KanbanCard>): KanbanCard {
	return { id: 'x', title: '', sourceNodeId: null, ...partial };
}

describe('cardMatches', () => {
	const c = card({
		title: 'Fix the login bug',
		description: 'Regenerate the auth token.',
		labels: [{ text: 'bug', color: '#ef4444' }],
		checklist: [
			{ id: '1', text: 'Write a failing test', done: false },
			{ id: '2', text: 'Deploy to staging', done: true }
		]
	});

	it('matches everything on an empty or whitespace query', () => {
		expect(cardMatches(c, '')).toBe(true);
		expect(cardMatches(c, '   ')).toBe(true);
	});

	it('matches the title case-insensitively', () => {
		expect(cardMatches(c, 'LOGIN')).toBe(true);
	});

	it('matches the description', () => {
		expect(cardMatches(c, 'auth token')).toBe(true);
	});

	it('matches label text', () => {
		expect(cardMatches(c, 'bug')).toBe(true);
	});

	it('matches label color hex', () => {
		expect(cardMatches(c, 'ef4444')).toBe(true);
	});

	it('matches checklist item text', () => {
		expect(cardMatches(c, 'staging')).toBe(true);
	});

	it('returns false when nothing matches', () => {
		expect(cardMatches(c, 'zzzznope')).toBe(false);
	});
});

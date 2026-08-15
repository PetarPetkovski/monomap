import { describe, expect, it } from 'vitest';
import { dueStatus, fromDateInputValue, toDateInputValue } from './due';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = new Date('2026-08-14T12:00:00').getTime();

describe('dueStatus', () => {
	it('flags past due dates as overdue', () => {
		expect(dueStatus(now - DAY, now)).toBe('overdue');
	});

	it('flags approaching deadlines within 48h as soon', () => {
		expect(dueStatus(now + 6 * HOUR, now)).toBe('soon');
		expect(dueStatus(now + 48 * HOUR, now)).toBe('soon');
	});

	it('treats far-future dates as ok', () => {
		expect(dueStatus(now + 7 * DAY, now)).toBe('ok');
	});
});

describe('date conversion', () => {
	it('round-trips through the date input value', () => {
		const ms = new Date(2026, 7, 14).getTime();
		expect(toDateInputValue(ms)).toBe('2026-08-14');
		expect(fromDateInputValue('2026-08-14')).toBe(ms);
	});

	it('returns 0 for an empty value', () => {
		expect(fromDateInputValue('')).toBe(0);
	});
});

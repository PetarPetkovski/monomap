import { describe, expect, it } from 'vitest';
import { normalizeUrl } from './url';

describe('normalizeUrl', () => {
	it('prepends https:// when the scheme is missing', () => {
		expect(normalizeUrl('example.com')).toBe('https://example.com');
		expect(normalizeUrl('  www.example.com/path ')).toBe('https://www.example.com/path');
	});

	it('keeps an existing http/https scheme', () => {
		expect(normalizeUrl('http://example.com')).toBe('http://example.com');
		expect(normalizeUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
	});

	it('keeps other schemes untouched', () => {
		expect(normalizeUrl('mailto:hi@example.com')).toBe('mailto:hi@example.com');
	});

	it('returns empty string for blank input', () => {
		expect(normalizeUrl('')).toBe('');
	});
});

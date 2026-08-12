import { describe, expect, it } from 'vitest';
import { calculateBezierPath } from './bezier';

describe('calculateBezierPath', () => {
	it('produces a cubic bezier path from parent to child', () => {
		expect(calculateBezierPath(0, 0, 240, 0)).toBe('M 0 0 C 120 0, 120 0, 240 0');
	});

	it('applies a minimum control offset for close nodes', () => {
		expect(calculateBezierPath(0, 0, 10, 0)).toBe('M 0 0 C 40 0, -30 0, 10 0');
	});

	it('handles vertical layout (parent above child)', () => {
		expect(calculateBezierPath(0, 0, 0, 100)).toBe('M 0 0 C 40 0, -40 100, 0 100');
	});

	it('handles reversed direction (child left of parent)', () => {
		expect(calculateBezierPath(240, 0, 0, 0)).toBe('M 240 0 C 360 0, -120 0, 0 0');
	});
});

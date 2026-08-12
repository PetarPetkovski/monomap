export function calculateBezierPath(parentX: number, parentY: number, childX: number, childY: number): string {
	const deltaX = childX - parentX;
	const controlPointOffset = Math.max(Math.abs(deltaX) / 2, 40);

	const controlPoint1X = parentX + controlPointOffset;
	const controlPoint1Y = parentY;
	const controlPoint2X = childX - controlPointOffset;
	const controlPoint2Y = childY;

	return `M ${parentX} ${parentY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${childX} ${childY}`;
}

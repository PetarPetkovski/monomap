export type DueStatus = 'overdue' | 'soon' | 'ok';

const SOON_MS = 48 * 60 * 60 * 1000;

export function dueStatus(dueMs: number, nowMs = Date.now()): DueStatus {
	if (dueMs < nowMs) return 'overdue';
	if (dueMs <= nowMs + SOON_MS) return 'soon';
	return 'ok';
}

export function toDateInputValue(ms: number): string {
	const d = new Date(ms);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function fromDateInputValue(value: string): number {
	if (!value) return 0;
	return new Date(`${value}T00:00:00`).getTime();
}

export function formatDueDate(ms: number): string {
	return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

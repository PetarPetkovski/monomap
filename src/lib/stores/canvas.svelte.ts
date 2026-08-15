import type { Vec2 } from '$lib/types';
import { ui } from '$lib/stores/ui.svelte';

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2.5;

export function clampZoom(value: number): number {
	return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export class CanvasState {
	x = $state(0);
	y = $state(0);
	zoom = $state(1);
	viewport = $state({ width: 0, height: 0 });
	selectedNodeId = $state<string | null>(null);
	editingNodeId = $state<string | null>(null);
	spaceDown = $state(false);
	sidebarOpen = $state(!ui.isCompact);
	panelOpen = $state(false);
	mdPaneOpen = $state(false);
	pendingCenterId = $state<string | null>(null);
	nodeSizes = $state<Record<string, { w: number; h: number }>>({});

	screenToWorld(sx: number, sy: number): Vec2 {
		return { x: (sx - this.x) / this.zoom, y: (sy - this.y) / this.zoom };
	}

	worldToScreen(wx: number, wy: number): Vec2 {
		return { x: wx * this.zoom + this.x, y: wy * this.zoom + this.y };
	}

	panBy(dx: number, dy: number): void {
		this.x += dx;
		this.y += dy;
	}

	zoomAt(sx: number, sy: number, factor: number): void {
		const next = clampZoom(this.zoom * factor);
		const k = next / this.zoom;
		this.x = sx - (sx - this.x) * k;
		this.y = sy - (sy - this.y) * k;
		this.zoom = next;
	}

	zoomBy(factor: number): void {
		this.zoomAt(this.viewport.width / 2, this.viewport.height / 2, factor);
	}

	centerOn(world: Vec2, zoom = this.zoom): void {
		this.zoom = zoom;
		this.x = this.viewport.width / 2 - world.x * zoom;
		this.y = this.viewport.height / 2 - world.y * zoom;
	}

	centerOnNode(node: { position: Vec2 }): void {
		this.centerOn(node.position, 1);
	}

	resetView(): void {
		this.centerOn({ x: 0, y: 0 }, 1);
	}

	selectNode(id: string | null): void {
		this.selectedNodeId = id;
	}

	startEditing(id: string): void {
		this.editingNodeId = id;
	}

	stopEditing(): void {
		this.editingNodeId = null;
	}

	clearSelection(): void {
		this.selectedNodeId = null;
		this.editingNodeId = null;
	}
}

export const canvas = new CanvasState();

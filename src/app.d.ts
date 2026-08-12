// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		// Debug/test hook — exposes live stores.
		__mindmap?: {
			workspace: import('$lib/stores/workspace.svelte').WorkspaceState;
			canvas: import('$lib/stores/canvas.svelte').CanvasState;
		};
	}
}

export {};

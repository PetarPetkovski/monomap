import { get, set } from 'idb-keyval';
import type { Workspace } from '$lib/types';

const STORAGE_KEY = 'mindmap:workspace';
const SAVE_DEBOUNCE_MS = 150;

export async function loadWorkspace(): Promise<Workspace | undefined> {
	try {
		return await get<Workspace>(STORAGE_KEY);
	} catch (error) {
		console.error('[db] failed to load workspace', error);
		return undefined;
	}
}

let timer: ReturnType<typeof setTimeout> | undefined;
let flush: (() => Promise<void>) | undefined;

export function scheduleSave(getData: () => Workspace): void {
	flush = async () => {
		try {
			await set(STORAGE_KEY, getData());
		} catch (error) {
			console.error('[db] failed to save workspace', error);
		}
	};

	clearTimeout(timer);
	timer = setTimeout(() => {
		const job = flush;
		flush = undefined;
		void job?.();
	}, SAVE_DEBOUNCE_MS);
}

export function flushSave(): void {
	clearTimeout(timer);
	const job = flush;
	flush = undefined;
	void job?.();
}

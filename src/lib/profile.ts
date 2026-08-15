import type { Workspace } from '$lib/types';
import { settings } from '$lib/stores/settings.svelte';
import { theme } from '$lib/stores/theme.svelte';
import { workspace } from '$lib/stores/workspace.svelte';

export interface Profile {
	app: 'mindmap';
	version: 1;
	exportedAt: number;
	workspace: Workspace;
	settings: {
		theme: 'light' | 'dark';
	};
}

export function buildProfile(): Profile {
	return {
		app: 'mindmap',
		version: 1,
		exportedAt: Date.now(),
		workspace: workspace.serialize(),
		settings: {
			theme: theme.theme
		}
	};
}

export function parseProfile(text: string): Profile | null {
	try {
		const data = JSON.parse(text);
		if (!data || data.app !== 'mindmap' || !Array.isArray(data?.workspace?.maps)) return null;
		return data as Profile;
	} catch {
		return null;
	}
}

export function applyProfile(profile: Profile): void {
	workspace.restore(profile.workspace);
	theme.theme = profile.settings.theme === 'dark' ? 'dark' : 'light';
}

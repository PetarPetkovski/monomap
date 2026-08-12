const STORAGE_KEY = 'mindmap:shortcuts';
const GRID_KEY = 'mindmap:grid';

function initialPref(key: string, defaultValue: boolean): boolean {
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(key);
		if (stored !== null) return stored !== 'false';
	}
	return defaultValue;
}

class SettingsState {
	shortcutsEnabled = $state(true);
	gridEnabled = $state(true);

	constructor() {
		this.shortcutsEnabled = initialPref(STORAGE_KEY, true);
		this.gridEnabled = initialPref(GRID_KEY, true);

		$effect.root(() => {
			$effect(() => {
				if (typeof localStorage === 'undefined') return;
				localStorage.setItem(STORAGE_KEY, String(this.shortcutsEnabled));
				localStorage.setItem(GRID_KEY, String(this.gridEnabled));
			});
		});
	}

	toggleShortcuts(): void {
		this.shortcutsEnabled = !this.shortcutsEnabled;
	}

	toggleGrid(): void {
		this.gridEnabled = !this.gridEnabled;
	}
}

export const settings = new SettingsState();

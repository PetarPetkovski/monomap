const GRID_KEY = 'mindmap:grid';

function initialPref(key: string, defaultValue: boolean): boolean {
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(key);
		if (stored !== null) return stored !== 'false';
	}
	return defaultValue;
}

class SettingsState {
	gridEnabled = $state(true);

	constructor() {
		this.gridEnabled = initialPref(GRID_KEY, true);

		$effect.root(() => {
			$effect(() => {
				if (typeof localStorage === 'undefined') return;
				localStorage.setItem(GRID_KEY, String(this.gridEnabled));
			});
		});
	}

	toggleGrid(): void {
		this.gridEnabled = !this.gridEnabled;
	}
}

export const settings = new SettingsState();

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'mindmap:theme';

function initialTheme(): Theme {
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === 'light' || stored === 'dark') return stored;
	}
	if (
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-color-scheme: dark)').matches
	) {
		return 'dark';
	}
	return 'light';
}

class ThemeState {
	theme = $state<Theme>('light');

	constructor() {
		this.theme = initialTheme();

		$effect.root(() => {
			$effect(() => {
				if (typeof document === 'undefined') return;
				document.documentElement.classList.toggle('dark', this.theme === 'dark');
				if (typeof localStorage !== 'undefined') {
					localStorage.setItem(STORAGE_KEY, this.theme);
				}
			});
		});
	}

	toggle(): void {
		this.theme = this.theme === 'dark' ? 'light' : 'dark';
	}
}

export const theme = new ThemeState();

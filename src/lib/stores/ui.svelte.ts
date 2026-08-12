function mediaMatches(query: string): boolean {
	return typeof window !== 'undefined' && typeof matchMedia === 'function' && matchMedia(query).matches;
}

class UiState {
	isCoarse = $state(false);
	isMobile = $state(false);
	isCompact = $derived(this.isCoarse || this.isMobile);

	constructor() {
		if (typeof window === 'undefined' || typeof matchMedia !== 'function') return;
		const coarse = matchMedia('(pointer: coarse)');
		const mobile = matchMedia('(max-width: 640px)');
		this.isCoarse = coarse.matches;
		this.isMobile = mobile.matches;
		coarse.addEventListener('change', (e) => (this.isCoarse = e.matches));
		mobile.addEventListener('change', (e) => (this.isMobile = e.matches));
	}
}

export const ui = new UiState();

export function isCoarse(): boolean {
	return mediaMatches('(pointer: coarse)');
}

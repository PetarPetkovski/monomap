export function normalizeUrl(url: string): string {
	const trimmed = url.trim();
	if (!trimmed) return trimmed;
	// Already has a scheme (http, https, mailto, ftp, …) — keep it.
	if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed;
	return `https://${trimmed}`;
}

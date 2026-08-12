export function downloadText(text: string, filename: string): void {
	downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename);
}

export function downloadJson(data: unknown, filename: string): void {
	downloadText(JSON.stringify(data, null, 2), filename);
}

export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
	const a = document.createElement('a');
	a.href = dataUrl;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
}

export function safeFilename(name: string): string {
	const cleaned = name.replace(/[^\w\- ]+/g, '').trim();
	return cleaned || 'map';
}

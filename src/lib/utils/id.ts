function uid(prefix = ''): string {
	const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
	return prefix ? `${prefix}_${id}` : id;
}

export function mapId(): string {
	return uid('map');
}

export function nodeId(): string {
	return uid('node');
}

export function folderId(): string {
	return uid('folder');
}

export function boardId(): string {
	return uid('board');
}

export function columnId(): string {
	return uid('col');
}

export function cardId(): string {
	return uid('card');
}

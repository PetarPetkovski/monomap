import type { MapData, MindNode } from '$lib/types';
import { nodeId } from '$lib/utils/id';

function createNode(text: string): MindNode {
	return { id: nodeId(), text, position: { x: 0, y: 0 }, children: [] };
}

export function mapToMarkdown(map: MapData): string {
	const lines: string[] = [];
	lines.push(`# ${map.rootNode.text || map.title || 'Map'}`);
	const pushOutline = (node: MindNode, depth: number) => {
		lines.push(`${'  '.repeat(depth)}- ${node.text}`);
		for (const child of node.children) pushOutline(child, depth + 1);
	};
	for (const child of map.rootNode.children) pushOutline(child, 0);
	return lines.join('\n') + '\n';
}

export function parseMarkdownTree(markdown: string, options?: { keepEmpty?: boolean }): MindNode {
	const keepEmpty = options?.keepEmpty ?? false;
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');

	// A document containing no headings/lists is plain text: for imports every
	// non-empty line becomes a sibling node (SPEC §4.4 `.txt` behavior). The
	// live split-view editor (keepEmpty) keeps skipping paragraphs.
	const hasMarkers = lines.some((raw) => {
		const line = raw.trimEnd();
		if (line.trim() === '') return false;
		return (
			/^(#{1,6})\s+/.test(line) ||
			/^(\s*)[-*+]\s+/.test(line) ||
			/^(\s*)\d+[.)]\s+/.test(line)
		);
	});
	if (!keepEmpty && !hasMarkers) {
		const root = createNode('Imported');
		for (const raw of lines) {
			const line = raw.trim();
			if (line) root.children.push(createNode(line));
		}
		return root;
	}

	let root: MindNode | null = null;
	const stack: Array<{ depth: number; node: MindNode }> = [];

	for (const raw of lines) {
		const line = raw.trimEnd();
		if (line.trim() === '') continue;

		let depth = 1;
		let text = '';
		let isMarker = false;

		const heading = line.match(/^(#{1,6})\s+(.*)$/);
		const bullet = line.match(/^(\s*)[-*+]\s+(.*)$/);
		const numbered = line.match(/^(\s*)\d+[.)]\s+(.*)$/);

		if (heading) {
			isMarker = true;
			depth = heading[1].length - 1;
			text = heading[2].trim();
		} else if (bullet) {
			isMarker = true;
			depth = 1 + Math.floor(bullet[1].length / 2);
			text = bullet[2].trim();
		} else if (numbered) {
			isMarker = true;
			depth = 1 + Math.floor(numbered[1].length / 2);
			text = numbered[2].trim();
		} else if (keepEmpty) {
			// Lone markers (e.g. `- ` after trimming) are empty placeholder nodes.
			const loneHash = line.match(/^(#{1,6})$/);
			const loneBullet = line.match(/^(\s*)[-*+]$/);
			if (loneHash) {
				isMarker = true;
				depth = loneHash[1].length - 1;
				text = '';
			} else if (loneBullet) {
				isMarker = true;
				depth = 1 + Math.floor(loneBullet[1].length / 2);
				text = '';
			}
		}

		// Plain paragraphs carry no structural meaning: skip them so that only
		// headings and list items become nodes.
		if (!isMarker) continue;

		if (!text) {
			// Keep empty marker lines (e.g. `- `) as placeholder nodes in the live editor.
			if (!(keepEmpty && isMarker)) continue;
		}
		const node = createNode(text);

		if (!root) {
			if (heading && depth === 0) {
				root = node;
				stack.push({ depth: 0, node });
				continue;
			}
			root = createNode('Imported');
			stack.push({ depth: -1, node: root });
		}

		while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
			stack.pop();
		}
		const parent = stack[stack.length - 1]?.node ?? root;
		parent.children.push(node);
		stack.push({ depth, node });
	}

	return root ?? createNode('Imported');
}

export function layoutTree(root: MindNode): void {
	const walk = (node: MindNode) => {
		const count = node.children.length;
		node.children.forEach((child, index) => {
			child.position = {
				x: node.position.x + 240,
				y: node.position.y + (index - (count - 1) / 2) * 56
			};
			walk(child);
		});
	};
	walk(root);
}

export function sortTree(root: MindNode): void {
	const comparator = (a: MindNode, b: MindNode) => a.text.localeCompare(b.text, undefined, { sensitivity: 'base' });
	const walk = (node: MindNode) => {
		node.children.sort(comparator);
		for (const child of node.children) walk(child);
	};
	walk(root);
}

export function tidyLayout(root: MindNode): void {
	let leafIndex = 0;
	const assign = (node: MindNode, depth: number): void => {
		node.position = { x: depth * 240, y: 0 };
		if (node.children.length === 0) {
			node.position.y = leafIndex++ * 56;
			return;
		}
		for (const child of node.children) assign(child, depth + 1);
		const first = node.children[0].position.y;
		const last = node.children[node.children.length - 1].position.y;
		node.position.y = (first + last) / 2;
	};
	assign(root, 0);
}

export function autoSortTree(root: MindNode): void {
	sortTree(root);
	tidyLayout(root);
}

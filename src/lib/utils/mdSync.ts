import type { MindNode } from '$lib/types';
import { nodeId } from '$lib/utils/id';
import { parseMarkdownTree } from '$lib/utils/treeExport';

function flatten(text: string): string {
	return text.replace(/\n+/g, ' ');
}

export function outlineFromTree(root: MindNode): string {
	const lines: string[] = [`# ${flatten(root.text)}`];
	const push = (node: MindNode, depth: number) => {
		lines.push(`${'  '.repeat(depth)}- ${flatten(node.text)}`);
		for (const child of node.children) push(child, depth + 1);
	};
	for (const child of root.children) push(child, 0);
	return lines.join('\n');
}

export function parseOutline(text: string): MindNode {
	if (text.trim() === '') {
		return { id: nodeId(), text: '', position: { x: 0, y: 0 }, children: [] };
	}
	// keepEmpty: `- ` lines become placeholder nodes so live edits round-trip.
	return parseMarkdownTree(text, { keepEmpty: true });
}

function defaultChildPosition(parent: MindNode, index: number): { x: number; y: number } {
	return { x: parent.position.x + 240, y: parent.position.y + (index + 1) * 56 };
}

function matchChildren(olds: MindNode[], news: MindNode[]): Map<number, number> {
	const n = olds.length;
	const m = news.length;
	const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
	for (let i = n - 1; i >= 0; i--) {
		for (let j = m - 1; j >= 0; j--) {
			dp[i][j] =
				olds[i].text === news[j].text
					? dp[i + 1][j + 1] + 1
					: Math.max(dp[i + 1][j], dp[i][j + 1]);
		}
	}

	// Recover LCS anchors (exact text matches).
	const anchors: Array<[number, number]> = [];
	let i = 0;
	let j = 0;
	while (i < n && j < m) {
		if (olds[i].text === news[j].text) {
			anchors.push([j, i]);
			i++;
			j++;
		} else if (dp[i + 1][j] >= dp[i][j + 1]) {
			i++;
		} else {
			j++;
		}
	}

	// Expand: within each gap, pair old/new by index when the counts match
	// (treats in-place renames as reuses so positions/styling are preserved).
	const pairs = new Map<number, number>();
	let oldPos = 0;
	let newPos = 0;
	for (const [anchorNew, anchorOld] of anchors) {
		const gapOld = anchorOld - oldPos;
		const gapNew = anchorNew - newPos;
		if (gapOld === gapNew) {
			for (let k = 0; k < gapNew; k++) pairs.set(newPos + k, oldPos + k);
		}
		pairs.set(anchorNew, anchorOld);
		oldPos = anchorOld + 1;
		newPos = anchorNew + 1;
	}
	const tailOld = n - oldPos;
	const tailNew = m - newPos;
	if (tailOld === tailNew) {
		for (let k = 0; k < tailNew; k++) pairs.set(newPos + k, oldPos + k);
	}

	// Final pass: match leftover new nodes against unused old nodes with the same
	// text (covers pure reorders the LCS did not anchor).
	const used = new Set(pairs.values());
	for (let j = 0; j < m; j++) {
		if (pairs.has(j)) continue;
		for (let i = 0; i < n; i++) {
			if (!used.has(i) && olds[i].text === news[j].text) {
				pairs.set(j, i);
				used.add(i);
				break;
			}
		}
	}
	return pairs;
}

function mergeChildren(olds: MindNode[], news: MindNode[], parent: MindNode): MindNode[] {
	const pairs = matchChildren(olds, news);
	const result: MindNode[] = [];
	news.forEach((parsed, newIndex) => {
		const oldIndex = pairs.get(newIndex);
		if (oldIndex !== undefined) {
			const old = olds[oldIndex];
			const text = flatten(old.text) === parsed.text ? old.text : parsed.text;
			result.push({
				...old,
				text,
				children: mergeChildren(old.children, parsed.children, old)
			});
		} else {
			const created: MindNode = {
				id: nodeId(),
				text: parsed.text,
				position: defaultChildPosition(parent, newIndex),
				children: []
			};
			created.children = mergeChildren([], parsed.children, created);
			result.push(created);
		}
	});
	return result;
}

export function mergeTree(oldRoot: MindNode, parsed: MindNode): MindNode {
	const text = flatten(oldRoot.text) === parsed.text ? oldRoot.text : parsed.text;
	return {
		...oldRoot,
		text,
		children: mergeChildren(oldRoot.children, parsed.children, oldRoot)
	};
}

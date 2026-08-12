import { toPng } from 'html-to-image';
import type { MindNode } from '$lib/types';
import { getContentBounds } from '$lib/utils/bounds';
import { downloadDataUrl, safeFilename } from '$lib/utils/download';

const PAD = 48;

export async function exportMapPng(
	title: string,
	worldEl: HTMLElement,
	sizes: Record<string, { w: number; h: number }>,
	root: MindNode
): Promise<void> {
	const bounds = getContentBounds(root, sizes);
	const original = {
		width: worldEl.style.width,
		height: worldEl.style.height,
		transform: worldEl.style.transform
	};

	worldEl.style.width = `${bounds.w + PAD * 2}px`;
	worldEl.style.height = `${bounds.h + PAD * 2}px`;
	worldEl.style.transform = `translate(${-bounds.x + PAD}px, ${-bounds.y + PAD}px) scale(1)`;

	try {
		const backgroundColor =
			getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim() || '#f6f6f3';
		const dataUrl = await toPng(worldEl, { pixelRatio: 2, backgroundColor });
		downloadDataUrl(dataUrl, `${safeFilename(title)}.png`);
	} finally {
		worldEl.style.width = original.width;
		worldEl.style.height = original.height;
		worldEl.style.transform = original.transform;
	}
}

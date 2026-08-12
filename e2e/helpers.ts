import type { Locator, Page } from '@playwright/test';

// The canvas node card is a [data-node] div; this locator avoids ambiguity
// with the sidebar map rows and notes drawer header that may render the same text.
export function nodeByText(page: Page, text: string): Locator {
	return page.locator('[data-node]').filter({ hasText: text });
}

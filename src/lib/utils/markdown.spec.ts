import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
	it('renders headings', () => {
		expect(renderMarkdown('# Title')).toBe('<h2>Title</h2>');
		expect(renderMarkdown('## Sub')).toBe('<h3>Sub</h3>');
		expect(renderMarkdown('### Small')).toBe('<h4>Small</h4>');
	});

	it('renders bullet lists', () => {
		expect(renderMarkdown('- one\n- two')).toBe('<ul>\n<li>one</li>\n<li>two</li>\n</ul>');
		expect(renderMarkdown('* a\n* b')).toBe('<ul>\n<li>a</li>\n<li>b</li>\n</ul>');
	});

	it('renders paragraphs and blank-line separation', () => {
		expect(renderMarkdown('hello\n\nworld')).toBe('<p>hello</p>\n\n<p>world</p>');
	});

	it('renders inline formatting', () => {
		expect(renderMarkdown('**bold**')).toBe('<p><strong>bold</strong></p>');
		expect(renderMarkdown('*italic*')).toBe('<p><em>italic</em></p>');
		expect(renderMarkdown('`code`')).toBe('<p><code>code</code></p>');
	});

	it('renders links', () => {
		expect(renderMarkdown('[docs](https://example.com)')).toBe(
			'<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">docs</a></p>'
		);
	});

	it('renders fenced code blocks verbatim', () => {
		expect(renderMarkdown('```\nconst a = 1 < 2;\n```')).toBe(
			'<pre><code>\nconst a = 1 &lt; 2;\n</code></pre>'
		);
	});

	it('escapes raw html', () => {
		expect(renderMarkdown('<script>alert(1)</script>')).toBe(
			'<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>'
		);
	});
});

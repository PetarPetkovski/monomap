function escapeHtml(src: string): string {
	return src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(src: string): string {
	let out = escapeHtml(src);
	out = out.replace(
		/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
		'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
	);
	out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
	out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
	return out;
}

export function renderMarkdown(src: string): string {
	const lines = src.replace(/\r\n/g, '\n').split('\n');
	const out: string[] = [];
	let inList = false;
	let inCode = false;
	let codeBuffer: string[] = [];

	for (const raw of lines) {
		const line = raw.trimEnd();

		if (line.startsWith('```')) {
			if (!inCode) {
				inCode = true;
				codeBuffer = [];
				out.push('<pre><code>');
			} else {
				inCode = false;
				out.push(escapeHtml(codeBuffer.join('\n')));
				out.push('</code></pre>');
			}
			continue;
		}

		if (inCode) {
			codeBuffer.push(line);
			continue;
		}

		const listMatch = line.match(/^\s*[-*+]\s+(.*)$/);
		if (listMatch) {
			if (!inList) {
				out.push('<ul>');
				inList = true;
			}
			out.push(`<li>${inline(listMatch[1])}</li>`);
			continue;
		}

		if (inList) {
			out.push('</ul>');
			inList = false;
		}

		if (line.startsWith('### ')) out.push(`<h4>${inline(line.slice(4))}</h4>`);
		else if (line.startsWith('## ')) out.push(`<h3>${inline(line.slice(3))}</h3>`);
		else if (line.startsWith('# ')) out.push(`<h2>${inline(line.slice(2))}</h2>`);
		else if (line.trim() === '') out.push('');
		else out.push(`<p>${inline(line)}</p>`);
	}

	if (inCode) {
		out.push(escapeHtml(codeBuffer.join('\n')));
		out.push('</code></pre>');
	}
	if (inList) out.push('</ul>');

	return out.join('\n');
}

<script lang="ts">
	let { title, updated, children }: { title: string; updated: string; children: import('svelte').Snippet } =
		$props();
</script>

<main class="legal">
	<a href="/" class="legal-brand">← MonoMap</a>
	<h1>{title}</h1>
	<p class="legal-updated">Last updated: {updated}</p>
	<div class="legal-body">
		{@render children()}
	</div>
</main>

<style>
	.legal {
		min-height: 100dvh;
		background: var(--canvas);
		color: var(--fg);
		font-family: 'Instrument Sans', system-ui, sans-serif;
		-webkit-font-smoothing: antialiased;
		padding: 56px clamp(20px, 6vw, 48px) 96px;
	}

	.legal-brand {
		display: inline-block;
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: 13px;
		color: var(--muted);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.legal-brand:hover {
		color: var(--fg);
	}

	h1 {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: clamp(28px, 4vw, 40px);
		letter-spacing: -0.01em;
		margin: 40px 0 8px;
	}

	.legal-updated {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: 12px;
		color: var(--muted);
		margin: 0 0 32px;
	}
</style>

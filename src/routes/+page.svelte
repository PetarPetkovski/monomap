<script lang="ts">
	// Static marketing page — SSR + prerendered. No browser-only code here.
	const SCHEMA = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'MonoMap',
		url: 'https://monomap.app/',
		applicationCategory: 'ProductivityApplication',
		operatingSystem: 'Web',
		description:
			'MonoMap is a single-purpose, keyboard-first, local-first mind map app. It opens instantly, works offline, and stays out of the way while you think.',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		author: { '@type': 'Organization', name: 'MonoMap', url: 'https://monomap.app/' }
	});
</script>

<svelte:head>
	<title>MonoMap - Free Mind Map App</title>
	<meta
		name="description"
		content="Free, local-first mind map app with .md support, zero bloat and minimal interface."
	/>
	<link rel="canonical" href="https://monomap.app/" />
	<meta name="robots" content="index, follow" />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="MonoMap" />
	<meta property="og:title" content="MonoMap - Free Mind Map App" />
	<meta
		property="og:description"
		content="Free, local-first mind map app with .md support, zero bloat and minimal interface."
	/>
	<meta property="og:url" content="https://monomap.app/" />
	<meta property="og:image" content="https://monomap.app/og-image.png" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="MonoMap - Free Mind Map App" />
	<meta
		name="twitter:description"
		content="Free, local-first mind map app with .md support, zero bloat and minimal interface."
	/>
	<meta name="twitter:image" content="https://monomap.app/og-image.png" />
</svelte:head>

<div class="landing">
	{@html `<script type="application/ld+json">${SCHEMA}</script>`}

	<nav class="nav">
		<a href="/" class="brand">
			<svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
				<circle cx="16" cy="16" r="8" fill="var(--accent)" />
				<circle cx="16" cy="16" r="4.5" fill="var(--canvas)" />
			</svg>
			<span class="brand-name">MonoMap</span>
		</a>
		<a href="/workspace" class="nav-link">
			Open the app
			<span aria-hidden="true">→</span>
		</a>
	</nav>

	<header class="hero">
		<h1 class="hero-title reveal" style="--d: 0ms">One tool.<br />One purpose.<br /><span class="accent">Zero bloat.</span></h1>
		<p class="hero-sub reveal" style="--d: 100ms">
			MonoMap is a keyboard-first, local-first mind map. It opens instantly, works
			offline, and never gets in the way of your thinking.
		</p>
		<div class="hero-cta reveal" style="--d: 200ms">
			<a href="/workspace" class="btn-primary">Start mapping <span aria-hidden="true">→</span></a>
			<a href="#features" class="btn-secondary">See what it does</a>
		</div>
		<p class="hero-note reveal" style="--d: 260ms">
			No sign-up · Free · Your maps stay on your device
		</p>

		<div class="mock-wrap reveal" style="--d: 320ms">
			<div class="mock">
				<svg viewBox="0 0 760 360" fill="none" aria-label="A small mind map: a root node connected to child nodes">
					<g class="paths">
						<path d="M 190 180 C 245 180, 245 74, 300 74" />
						<path d="M 190 180 C 245 180, 245 180, 300 180" />
						<path d="M 190 180 C 245 180, 245 286, 300 286" />
						<path d="M 450 74 C 505 74, 505 74, 560 74" />
						<path d="M 450 286 C 505 286, 505 286, 560 286" />
					</g>
					<g class="nodes">
						<rect class="pill root" x="40" y="158" width="150" height="44" rx="10" />
						<text class="label root-label" x="115" y="180">MonoMap</text>
						<rect class="pill" x="300" y="52" width="150" height="44" rx="10" />
						<text class="label" x="375" y="74">Think</text>
						<rect class="pill" x="300" y="158" width="150" height="44" rx="10" />
						<text class="label" x="375" y="180">Note</text>
						<rect class="pill" x="300" y="264" width="150" height="44" rx="10" />
						<text class="label" x="375" y="286">Link</text>
						<rect class="pill" x="560" y="52" width="150" height="44" rx="10" />
						<text class="label" x="635" y="74">Ship</text>
						<rect class="pill" x="560" y="264" width="150" height="44" rx="10" />
						<text class="label" x="635" y="286">Share</text>
					</g>
				</svg>
			</div>
		</div>
	</header>

	<section class="section" id="why">
		<h2 class="section-title">It stays small on purpose.</h2>
		<p class="section-lede">
			Most tools grow until they bury your thinking under menus and features. MonoMap does one
			thing — mind mapping — and does it without getting in the way.
		</p>
		<div class="principles">
			<div class="principle">
				<span class="principle-num">1</span>
				<h3>One job</h3>
				<p>A mind map. Not a suite, not a dashboard, not a subscription.</p>
			</div>
			<div class="principle">
				<span class="principle-num">2</span>
				<h3>Keyboard-first</h3>
				<p>Tab to branch, Enter to continue, Space to rename. Hands never leave the keys.</p>
			</div>
			<div class="principle">
				<span class="principle-num">3</span>
				<h3>Local-first</h3>
				<p>Your maps live in your browser and work offline. Export or back them up any time.</p>
			</div>
		</div>
	</section>

	<section class="section" id="features">
		<h2 class="section-title">Every feature earns its place.</h2>
		<div class="feature-grid">
			<div class="feature">
				<h3>Infinite canvas</h3>
				<p>Pan, zoom, and drag nodes anywhere. The map grows as big as your thinking.</p>
			</div>
			<div class="feature">
				<h3>Live Markdown split view</h3>
				<p>Type an outline on the left, watch the map build itself on the right.</p>
			</div>
			<div class="feature">
				<h3>Notes, links &amp; style</h3>
				<p>Attach plain-text notes, links, colors, and icons to any node.</p>
			</div>
			<div class="feature">
				<h3>Organized workspace</h3>
				<p>Folders, multiple tabs, and drag-and-drop organization.</p>
			</div>
			<div class="feature">
				<h3>Your data, yours</h3>
				<p>Local-first storage with Markdown, PNG, and JSON export — plus full profile backups.</p>
			</div>
			<div class="feature">
				<h3>Instantly responsive</h3>
				<p>Sub-50&nbsp;ms interactions and debounced autosave. No waiting around.</p>
			</div>
		</div>
	</section>

	<section class="cta-band">
		<h2 class="cta-title">Stop organizing your tools.<br />Start thinking.</h2>
		<a href="/workspace" class="btn-primary btn-lg">Start mapping <span aria-hidden="true">→</span></a>
		<p class="hero-note">No sign-up · Free · Works offline</p>
	</section>

	<footer class="footer">
		<span class="brand-name">MonoMap</span>
		<span class="footer-tag">One tool. One purpose. Zero bloat.</span>
		<div class="footer-links">
			<a href="/privacy" class="footer-link">Privacy Policy</a>
			<a href="/terms" class="footer-link">Terms of Service</a>
			<a href="https://www.tehnika.mk" target="_blank" rel="noopener noreferrer" class="footer-link">
				A product by Tehnika
			</a>
			<a href="https://github.com/tehnika-mk/monomap" target="_blank" rel="noopener noreferrer" class="footer-link">
				GitHub
			</a>
			<a href="mailto:hello@tehnika.mk" class="footer-link">hello@tehnika.mk</a>
			<span class="footer-copy">© 2026 MonoMap</span>
		</div>
	</footer>
</div>

<style>
	.landing {
		min-height: 100dvh;
		background: var(--canvas);
		color: var(--fg);
		font-family: 'Instrument Sans', system-ui, sans-serif;
		-webkit-font-smoothing: antialiased;
		display: flex;
		flex-direction: column;
	}

	/* --- Navigation --- */
	.nav {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px clamp(20px, 6vw, 64px);
		background: color-mix(in srgb, var(--canvas) 82%, transparent);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--edge);
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		text-decoration: none;
		color: var(--fg);
	}

	.brand-name {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: 15px;
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	.nav-link {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: 12.5px;
		color: var(--muted);
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		transition: color 0.15s ease;
	}

	.nav-link:hover {
		color: var(--fg);
	}

	/* --- Hero --- */
	.hero {
		position: relative;
		text-align: center;
		padding: clamp(72px, 12vh, 120px) 20px 40px;
		overflow: hidden;
	}

	.hero::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image: radial-gradient(var(--edge) 1px, transparent 1px);
		background-size: 26px 26px;
		mask-image: radial-gradient(ellipse 60% 55% at 50% 32%, black 30%, transparent 75%);
		pointer-events: none;
	}

	.hero-title {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: clamp(38px, 7vw, 72px);
		line-height: 1.04;
		letter-spacing: -0.02em;
		margin: 0 auto;
		max-width: 15ch;
	}

	.hero-title .accent {
		color: var(--accent);
	}

	.hero-sub {
		margin: 28px auto 0;
		max-width: 52ch;
		font-size: clamp(16px, 2vw, 19px);
		line-height: 1.55;
		color: var(--muted);
	}

	.hero-cta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14px;
		margin-top: 40px;
		flex-wrap: wrap;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 14px 26px;
		border-radius: 9999px;
		background: var(--accent);
		color: var(--accent-fg);
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-decoration: none;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
		box-shadow: 0 6px 20px color-mix(in srgb, var(--accent) 35%, transparent);
	}

	.btn-primary:hover {
		transform: translateY(-1px);
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		padding: 14px 22px;
		border-radius: 9999px;
		border: 1px solid var(--edge);
		color: var(--fg);
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: 13.5px;
		text-decoration: none;
		transition: background 0.15s ease;
	}

	.btn-secondary:hover {
		background: var(--surface);
	}

	.hero-note {
		margin-top: 18px;
		font-size: 13px;
		color: var(--muted);
	}

	/* --- SVG mock --- */
	.mock-wrap {
		position: relative;
		margin: 72px auto 0;
		max-width: 780px;
	}

	.mock {
		border: 1px solid var(--edge);
		border-radius: 20px;
		background: var(--surface);
		box-shadow:
			0 30px 80px -30px rgb(0 0 0 / 0.18),
			0 2px 8px rgb(0 0 0 / 0.04);
		padding: 10px;
		overflow: hidden;
	}

	.mock svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.paths path {
		stroke: var(--edge);
		stroke-width: 2;
		stroke-linecap: round;
		fill: none;
		stroke-dasharray: 420;
		stroke-dashoffset: 420;
		animation: draw 1.1s ease forwards;
	}

	.paths path:nth-child(2) {
		animation-delay: 0.08s;
	}

	.paths path:nth-child(3) {
		animation-delay: 0.16s;
	}

	.paths path:nth-child(4) {
		animation-delay: 0.24s;
	}

	.paths path:nth-child(5) {
		animation-delay: 0.32s;
	}

	.pill {
		fill: var(--surface);
		stroke: var(--edge);
		stroke-width: 1.5;
	}

	.pill.root {
		fill: color-mix(in srgb, var(--accent) 10%, var(--surface));
		stroke: color-mix(in srgb, var(--accent) 55%, var(--edge));
	}

	.label {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: 12px;
		font-weight: 500;
		fill: var(--fg);
		text-anchor: middle;
		dominant-baseline: central;
	}

	.root-label {
		fill: var(--accent);
		font-weight: 600;
	}

	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	/* --- Sections --- */
	.section {
		max-width: 1080px;
		margin: 0 auto;
		padding: clamp(72px, 10vh, 120px) clamp(20px, 6vw, 48px);
		width: 100%;
	}

	.section-title {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: clamp(26px, 4vw, 40px);
		line-height: 1.12;
		letter-spacing: -0.01em;
		margin: 18px 0 0;
	}

	.section-lede {
		margin-top: 22px;
		max-width: 62ch;
		font-size: 16px;
		line-height: 1.65;
		color: var(--muted);
	}

	.principles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 28px;
		margin-top: 52px;
	}

	.principle {
		border-top: 1px solid var(--edge);
		padding-top: 20px;
	}

	.principle-num {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: 13px;
		color: var(--accent);
	}

	.principle h3 {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: 16px;
		font-weight: 600;
		margin: 12px 0 8px;
	}

	.principle p {
		font-size: 14.5px;
		line-height: 1.6;
		color: var(--muted);
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1px;
		margin-top: 48px;
		background: var(--edge);
		border: 1px solid var(--edge);
		border-radius: 16px;
		overflow: hidden;
	}

	.feature {
		background: var(--canvas);
		padding: 26px 26px 30px;
	}

	.feature h3 {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: 14px;
		font-weight: 600;
		margin: 0 0 10px;
	}

	.feature p {
		font-size: 14px;
		line-height: 1.6;
		color: var(--muted);
	}

	/* --- CTA band --- */
	.cta-band {
		text-align: center;
		padding: clamp(80px, 12vh, 130px) 20px;
		border-top: 1px solid var(--edge);
		border-bottom: 1px solid var(--edge);
		background: color-mix(in srgb, var(--accent) 4%, var(--canvas));
	}

	.cta-title {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: clamp(28px, 5vw, 46px);
		line-height: 1.12;
		letter-spacing: -0.01em;
		margin: 0 0 36px;
	}

	.btn-lg {
		padding: 16px 32px;
		font-size: 15px;
	}

	/* --- Footer --- */
	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		padding: 28px clamp(20px, 6vw, 64px);
		font-size: 13px;
		color: var(--muted);
	}

	.footer-tag {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: 12px;
	}

	.footer-links {
		display: flex;
		align-items: center;
		gap: 14px;
		flex-wrap: wrap;
	}

	.footer-link {
		color: var(--muted);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.footer-link:hover {
		color: var(--fg);
	}

	.footer-copy {
		font-size: 12.5px;
	}

	/* --- Entrance reveals --- */
	.reveal {
		opacity: 0;
		transform: translateY(14px);
		animation: rise 0.7s ease forwards;
		animation-delay: var(--d);
	}

	@keyframes rise {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.reveal {
			opacity: 1;
			transform: none;
			animation: none;
		}
		.paths path {
			stroke-dasharray: none;
			stroke-dashoffset: 0;
			animation: none;
		}
	}
</style>

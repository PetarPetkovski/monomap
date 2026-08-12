<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>MonoMap</title>
	<meta name="theme-color" content="#f6f6f3" />
	<meta name="description" content="MonoMap — a single-purpose, keyboard-first, local-first mind map. One tool, one job, zero bloat." />
	<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='8' fill='%233b82f6'/%3E%3Ccircle cx='16' cy='16' r='4.5' fill='%23f6f6f3'/%3E%3C/svg%3E" />

	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{@render children()}

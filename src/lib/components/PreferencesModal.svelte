<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { applyProfile, buildProfile, parseProfile } from '$lib/profile';
	import { downloadJson } from '$lib/utils/download';

	let profileInput = $state<HTMLInputElement | null>(null);
	let importingProfile = $state(false);

	function saveProfile() {
		downloadJson(buildProfile(), 'mindmap-profile.json');
	}

	async function importProfileFile(file: File) {
		const text = await file.text();
		const profile = parseProfile(text);
		if (!profile) {
			alert('This is not a valid Mind Map profile file.');
			return;
		}
		const confirmed = confirm('Replace your current local workspace with this profile?');
		if (confirmed) applyProfile(profile);
	}

	function onProfileChosen(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			importingProfile = true;
			void importProfileFile(file).finally(() => {
				importingProfile = false;
				input.value = '';
			});
		}
	}

	function close() {
		window.dispatchEvent(new CustomEvent('mindmap:close-preferences'));
	}
</script>

<div class="backdrop" onclick={close} aria-hidden="true"></div>
<div class="modal" role="dialog" aria-modal="true" aria-label="Preferences">
	<button type="button" class="close" aria-label="Close" onclick={close}>&times;</button>
	<h2 class="title">Preferences</h2>

	<div class="prefs">
		<button
			type="button"
			class="pref-row"
			class:active={theme.theme === 'dark'}
			aria-pressed={theme.theme === 'dark'}
			title="Toggle dark mode"
			onclick={() => theme.toggle()}
		>
			<span class="pref-glyph">
				{#if theme.theme === 'dark'}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						<circle cx="12" cy="12" r="4" />
						<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
					</svg>
				{:else}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
					</svg>
				{/if}
			</span>
			<span class="pref-name">{theme.theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
		</button>
		<button
			type="button"
			class="pref-row"
			class:active={settings.gridEnabled}
			aria-pressed={settings.gridEnabled}
			title="Background Dots"
			onclick={() => settings.toggleGrid()}
		>
			<span class="pref-glyph">
				<svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
					<circle cx="2" cy="2" r="1.1" />
					<circle cx="6" cy="2" r="1.1" />
					<circle cx="10" cy="2" r="1.1" />
					<circle cx="2" cy="6" r="1.1" />
					<circle cx="6" cy="6" r="1.1" />
					<circle cx="10" cy="6" r="1.1" />
					<circle cx="2" cy="10" r="1.1" />
					<circle cx="6" cy="10" r="1.1" />
					<circle cx="10" cy="10" r="1.1" />
				</svg>
			</span>
			<span class="pref-name">Background Dots</span>
		</button>
	</div>

	<div class="profile">
		<span class="profile-label">Profile backup</span>
		<div class="profile-actions">
			<button type="button" onclick={saveProfile}>Save profile</button>
			<button type="button" disabled={importingProfile} onclick={() => profileInput?.click()}>
				{importingProfile ? 'Importing…' : 'Import profile'}
			</button>
		</div>
		<input
			bind:this={profileInput}
			type="file"
			accept=".json,application/json"
			data-testid="import-profile"
			class="hidden"
			onchange={onProfileChosen}
		/>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 90;
		background: rgb(0 0 0 / 0.35);
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 91;
		width: min(360px, calc(100vw - 32px));
		background: var(--surface);
		border: 1px solid var(--edge);
		border-radius: 16px;
		box-shadow: 0 24px 64px rgb(0 0 0 / 0.25);
		padding: 24px;
	}

	.close {
		position: absolute;
		top: 12px;
		right: 12px;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: 20px;
		line-height: 1;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 6px;
	}

	.close:hover {
		color: var(--fg);
		background: var(--surface-2);
	}

	.title {
		font-size: 17px;
		font-weight: 600;
		margin: 0 0 16px;
	}

	.prefs {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.pref-row {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 9px 8px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--fg);
		font-size: 13px;
		text-align: left;
		cursor: pointer;
	}

	.pref-row:hover,
	.pref-row.active {
		background: var(--surface-2);
	}

	.pref-glyph {
		width: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--muted);
		flex: none;
	}

	.pref-name {
		flex: 1;
	}

	.profile {
		margin-top: 18px;
		padding-top: 16px;
		border-top: 1px solid var(--edge);
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.profile-label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
	}

	.profile-actions {
		display: flex;
		gap: 8px;
	}

	.profile-actions button {
		flex: 1;
		padding: 9px 8px;
		border: 1px solid var(--edge);
		border-radius: 8px;
		background: transparent;
		color: var(--fg);
		font-size: 12.5px;
		cursor: pointer;
	}

	.profile-actions button:hover {
		background: var(--surface-2);
	}

	.profile-actions button:disabled {
		opacity: 0.6;
		cursor: default;
	}
</style>

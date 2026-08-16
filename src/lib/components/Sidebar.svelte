<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { KanbanBoard, MapData } from '$lib/types';
	import { canvas } from '$lib/stores/canvas.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import PreferencesModal from './PreferencesModal.svelte';
	import { downloadText, safeFilename } from '$lib/utils/download';
	import { exportMapPng } from '$lib/utils/exportPng';
	import { autoSortTree, mapToMarkdown, parseMarkdownTree } from '$lib/utils/treeExport';

	let showPreferences = $state(false);

	// Folder creation is temporarily hidden; existing folders still render.
	const foldersEnabled = false;

	$effect(() => {
		const onClosePrefs = () => (showPreferences = false);
		window.addEventListener('mindmap:close-preferences', onClosePrefs);
		return () => window.removeEventListener('mindmap:close-preferences', onClosePrefs);
	});

	const maps = $derived(workspace.maps);
	const folders = $derived(workspace.folders);
	const boards = $derived(workspace.boards);
	const activeTabId = $derived(workspace.activeTabId);
	const activeBoardId = $derived(workspace.activeBoardId);
	const open = $derived(canvas.sidebarOpen);
	const unassigned = $derived(maps.filter((m) => !m.folderId));
	const heading = $derived(workspace.viewMode === 'kanban' ? 'Kanban' : 'Mind Map');
	const isMindMap = $derived(workspace.viewMode !== 'kanban');

	let expanded = $state<Record<string, boolean>>({});
	let menuFor = $state<string | null>(null);
	let folderMenuFor = $state<string | null>(null);
	let boardMenuFor = $state<string | null>(null);
	let renaming = $state<{ type: 'map' | 'folder' | 'board'; id: string } | null>(null);
	let renameDraft = $state('');
	let addingFolder = $state(false);
	let newFolderDraft = $state('');
	let dragTarget = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);
	let importing = $state(false);

	function folderExpanded(folderId: string) {
		return expanded[folderId] !== false;
	}

	function folderMaps(folderId: string) {
		return maps.filter((m) => m.folderId === folderId);
	}

	function startRename(type: 'map' | 'folder' | 'board', id: string, current: string) {
		renaming = { type, id };
		renameDraft = current;
		menuFor = null;
		folderMenuFor = null;
		boardMenuFor = null;
	}

	function commitRename() {
		if (!renaming) return;
		const value = renameDraft.trim();
		if (renaming.type === 'map') workspace.renameMap(renaming.id, value || 'Untitled Map');
		else if (renaming.type === 'folder') workspace.renameFolder(renaming.id, value || 'Folder');
		else workspace.renameBoard(renaming.id, value || 'Untitled Board');
		renaming = null;
	}

	function commitNewFolder() {
		const value = newFolderDraft.trim();
		if (value) workspace.createFolder(value);
		addingFolder = false;
		newFolderDraft = '';
	}

	function exportMapMd(map: MapData) {
		downloadText(mapToMarkdown(map), `${safeFilename(map.title)}.md`);
	}

	async function exportMapPngAction(map: MapData) {
		const world = document.querySelector<HTMLElement>('[data-world]');
		if (!world) return;
		await exportMapPng(map.title, world, canvas.nodeSizes, map.rootNode);
	}

	async function importFile(file: File) {
		const text = await file.text();
		const root = parseMarkdownTree(text);
		autoSortTree(root);
		const title = file.name.replace(/\.(md|markdown|txt)$/i, '') || 'Imported';
		workspace.createMapFromRoot(title, root);
	}

	function onFileChosen(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			importing = true;
			void importFile(file).finally(() => {
				importing = false;
				input.value = '';
			});
		}
	}

	function onDragStart(e: DragEvent, mapId: string) {
		e.dataTransfer?.setData('text/map', mapId);
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}

	function onDragOver(e: DragEvent, target: string) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragTarget = target;
	}

	function onDrop(e: DragEvent, target: string) {
		e.preventDefault();
		dragTarget = null;
		const id = e.dataTransfer?.getData('text/map');
		if (id) workspace.moveMap(id, target === 'root' ? null : target);
	}

	function autofocus(el: HTMLInputElement) {
		el.focus();
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			menuFor = null;
			folderMenuFor = null;
			boardMenuFor = null;
			renaming = null;
			addingFolder = false;
		}
	}}
	onclick={() => {
		menuFor = null;
		folderMenuFor = null;
		boardMenuFor = null;
	}}
/>

{#if open}
	{#if ui.isCompact}
		<div class="backdrop" onclick={() => (canvas.sidebarOpen = false)} aria-hidden="true"></div>
	{/if}
	<div class="panel" role="complementary" aria-label="Maps sidebar" transition:slide={{ duration: 160 }}>
		<header>
			<span class="heading">{heading}</span>
			<button
				type="button"
				class="icon-btn"
				title="Close sidebar"
				aria-label="Close sidebar"
				onclick={() => (canvas.sidebarOpen = false)}
			>
				‹
			</button>
		</header>

		<div class="tree">
			{#if isMindMap}
				<button
					type="button"
					class="tree-row"
					class:active={canvas.mdPaneOpen}
					aria-pressed={canvas.mdPaneOpen}
					title="Toggle MD Editor"
					onclick={() => (canvas.mdPaneOpen = !canvas.mdPaneOpen)}
				>
					<span class="glyph">≔</span>
					<span class="label">MD Editor</span>
				</button>
			{/if}
			<div class="group-label">Create</div>
			<button
				type="button"
				class="tree-row dropzone"
				class:drag-over={dragTarget === 'root'}
				ondragover={(e) => onDragOver(e, 'root')}
				ondragleave={() => (dragTarget = null)}
				ondrop={(e) => onDrop(e, 'root')}
				onclick={() => workspace.createMap()}
			>
				<span class="glyph">＋</span>
				<span class="label">New map</span>
			</button>

			{#if foldersEnabled}
				{#if addingFolder}
					<input
						class="rename-input new-folder-input"
						bind:value={newFolderDraft}
						placeholder="Folder name"
						use:autofocus
						onkeydown={(e) => {
							if (e.key === 'Enter') commitNewFolder();
							if (e.key === 'Escape') {
								addingFolder = false;
								newFolderDraft = '';
							}
						}}
						onblur={commitNewFolder}
					/>
				{:else}
					<button type="button" class="tree-row" onclick={() => (addingFolder = true)}>
						<span class="glyph">＋</span>
						<span class="label">New folder</span>
					</button>
				{/if}
			{/if}

			<button type="button" class="tree-row" onclick={() => workspace.createBoard()}>
				<span class="glyph">＋</span>
				<span class="label">New Kanban Board</span>
			</button>

			<button type="button" class="tree-row" disabled={importing} onclick={() => fileInput?.click()}>
				<span class="glyph">{importing ? '…' : '⇪'}</span>
				<span class="label">{importing ? 'Importing…' : 'Import .md / .txt'}</span>
			</button>
			<input
				bind:this={fileInput}
				type="file"
				accept=".md,.markdown,.txt,text/markdown,text/plain"
				data-testid="import-markdown"
				class="hidden"
				onchange={onFileChosen}
			/>

			{#if unassigned.length > 0}
				<div class="group-label">Mind Maps</div>
				{#each unassigned as map (map.id)}
					{@render MapRow(map)}
				{/each}
			{/if}

			{#if folders.length > 0}
				<div class="group-label">Folders</div>
			{/if}
			{#each folders as folder (folder.id)}
				<div class="folder">
					<div
						class="tree-row folder-head"
						class:drag-over={dragTarget === folder.id}
						role="group"
						ondragover={(e) => onDragOver(e, folder.id)}
						ondragleave={() => (dragTarget = null)}
						ondrop={(e) => onDrop(e, folder.id)}
						ondblclick={() => {
							if (!renaming) startRename('folder', folder.id, folder.name);
						}}
					>
						<button
							type="button"
							class="fold-toggle"
							aria-label={`Toggle folder ${folder.name}`}
							onclick={(e) => {
								e.stopPropagation();
								expanded[folder.id] = !folderExpanded(folder.id);
							}}
						>
							{folderExpanded(folder.id) ? '▾' : '▸'}
						</button>
						<span class="glyph">📁</span>
						{#if renaming?.type === 'folder' && renaming.id === folder.id}
							<input
								class="rename-input"
								bind:value={renameDraft}
								use:autofocus
								onclick={(e) => e.stopPropagation()}
								onkeydown={(e) => {
									if (e.key === 'Enter') commitRename();
									if (e.key === 'Escape') renaming = null;
								}}
								onblur={commitRename}
							/>
						{:else}
							<span class="label">{folder.name}</span>
						{/if}
						<span class="count">{folderMaps(folder.id).length}</span>
						<button
							type="button"
							class="menu-btn"
							aria-label="Folder actions"
							onclick={(e) => {
								e.stopPropagation();
								folderMenuFor = folderMenuFor === folder.id ? null : folder.id;
								menuFor = null;
								boardMenuFor = null;
							}}
							ondblclick={(e) => e.stopPropagation()}
						>
							⋯
						</button>
						{#if folderMenuFor === folder.id}
							<div class="menu">
								<button type="button" onclick={() => startRename('folder', folder.id, folder.name)}>
									Rename
								</button>
								<button
									type="button"
									onclick={() => {
										workspace.deleteFolder(folder.id);
										folderMenuFor = null;
									}}
								>
									Delete
								</button>
							</div>
						{/if}
					</div>

					{#if folderExpanded(folder.id)}
						<div
							class="dropzone"
							class:drag-over={dragTarget === folder.id}
							role="group"
							ondragover={(e) => onDragOver(e, folder.id)}
							ondragleave={() => (dragTarget = null)}
							ondrop={(e) => onDrop(e, folder.id)}
						>
							{#each folderMaps(folder.id) as map (map.id)}
								{@render MapRow(map)}
							{/each}
						</div>
					{/if}
				</div>
			{/each}

			{#if boards.length > 0}
				<div class="group-label">Kanban Boards</div>
			{/if}
			{#each boards as board (board.id)}
				{@render BoardRow(board)}
			{/each}
		</div>

		<button type="button" class="tree-row prefs-row" onclick={() => (showPreferences = true)}>
			<span class="glyph">⚙</span>
			<span class="label">Preferences</span>
		</button>
	</div>

	{#if showPreferences}
		<PreferencesModal />
	{/if}
{:else}
	<button
		type="button"
		class="handle"
		title="Toggle sidebar"
		aria-label="Toggle sidebar"
		onclick={() => (canvas.sidebarOpen = true)}
	>
		☰
	</button>
{/if}

{#snippet MapRow(map: MapData)}
	<div
		class="tree-row map-row"
		class:active={activeTabId === map.id}
		role="button"
		tabindex="-1"
		draggable="true"
		ondragstart={(e) => onDragStart(e, map.id)}
		onclick={(e) => {
			if ((e.target as HTMLElement).closest('.menu')) return;
			workspace.openTab(map.id);
		}}
		ondblclick={() => {
			if (!renaming) startRename('map', map.id, map.title);
		}}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				workspace.openTab(map.id);
			}
		}}
	>
		{#if renaming?.type === 'map' && renaming.id === map.id}
			<input
				class="rename-input"
				bind:value={renameDraft}
				use:autofocus
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => {
					if (e.key === 'Enter') commitRename();
					if (e.key === 'Escape') renaming = null;
				}}
				onblur={commitRename}
			/>
		{:else}
			<span class="label" title={map.title}>{map.title}</span>
		{/if}
		<button
			type="button"
			class="menu-btn"
			aria-label={`Actions for ${map.title}`}
			onclick={(e) => {
				e.stopPropagation();
				menuFor = menuFor === map.id ? null : map.id;
				folderMenuFor = null;
			}}
			ondblclick={(e) => e.stopPropagation()}
		>
			⋯
		</button>
		{#if menuFor === map.id}
			<div class="menu">
				<button type="button" onclick={() => startRename('map', map.id, map.title)}>Rename</button>
				<button
					type="button"
					onclick={() => {
						workspace.duplicateMap(map.id);
						menuFor = null;
					}}
				>
					Duplicate
				</button>
				<button
					type="button"
					onclick={() => {
						exportMapMd(map);
						menuFor = null;
					}}
				>
					Export .md
				</button>
				<button
					type="button"
					onclick={() => {
						menuFor = null;
						void exportMapPngAction(map);
					}}
				>
					Export PNG
				</button>
				<button
					type="button"
					class="danger"
					onclick={() => {
						workspace.deleteMap(map.id);
						menuFor = null;
					}}
				>
					Delete
				</button>
			</div>
		{/if}
	</div>
{/snippet}

{#snippet BoardRow(board: KanbanBoard)}
	<div
		class="tree-row board-row"
		class:active={activeBoardId === board.id && workspace.viewMode === 'kanban'}
		role="button"
		tabindex="-1"
		onclick={(e) => {
			if ((e.target as HTMLElement).closest('.menu')) return;
			workspace.openBoard(board.id);
		}}
		ondblclick={() => {
			if (!renaming) startRename('board', board.id, board.title);
		}}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				workspace.openBoard(board.id);
			}
		}}
	>
		{#if renaming?.type === 'board' && renaming.id === board.id}
			<input
				class="rename-input"
				bind:value={renameDraft}
				use:autofocus
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => {
					if (e.key === 'Enter') commitRename();
					if (e.key === 'Escape') renaming = null;
				}}
				onblur={commitRename}
			/>
		{:else}
			<span class="label" title={board.title}>{board.title}</span>
		{/if}
		<span class="count">{board.columns.length}</span>
		<button
			type="button"
			class="menu-btn"
			aria-label={`Actions for ${board.title}`}
			onclick={(e) => {
				e.stopPropagation();
				boardMenuFor = boardMenuFor === board.id ? null : board.id;
				menuFor = null;
				folderMenuFor = null;
			}}
			ondblclick={(e) => e.stopPropagation()}
		>
			⋯
		</button>
		{#if boardMenuFor === board.id}
			<div class="menu">
				<button type="button" onclick={() => startRename('board', board.id, board.title)}>
					Rename
				</button>
				<button
					type="button"
					class="danger"
					onclick={() => {
						workspace.deleteBoard(board.id);
						boardMenuFor = null;
					}}
				>
					Delete
				</button>
			</div>
		{/if}
	</div>
{/snippet}

<style>
	.panel {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		width: 272px;
		z-index: 40;
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border-right: 1px solid var(--edge);
		box-shadow: 8px 0 24px rgb(0 0 0 / 0.08);
	}

	.backdrop {
		position: absolute;
		inset: 0;
		z-index: 39;
		background: rgb(0 0 0 / 0.3);
	}

	@media (max-width: 640px) {
		.panel {
			width: min(320px, 84vw);
			padding-top: env(safe-area-inset-top);
		}
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 48px;
		padding: 0 14px;
		border-bottom: 1px solid var(--edge);
	}

	.heading {
		font-size: 13px;
		font-weight: 600;
	}

	.icon-btn {
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: 20px;
		line-height: 1;
		cursor: pointer;
		padding: 2px 8px;
		border-radius: 6px;
	}

	.icon-btn:hover {
		color: var(--fg);
		background: var(--surface-2);
	}

	.tree {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.tree-row {
		position: relative;
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 6px 8px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--fg);
		font-size: 13px;
		text-align: left;
		cursor: pointer;
		transition: background 0.1s ease;
	}

	.tree-row:hover {
		background: var(--surface-2);
	}

	.tree-row.active {
		background: var(--surface-2);
	}

	.tree-row.drag-over,
	.dropzone.drag-over {
		background: color-mix(in srgb, var(--accent) 14%, var(--surface-2));
	}

	.prefs-row {
		margin: 4px 8px 8px;
		width: calc(100% - 16px);
		border: 1px solid var(--edge);
	}

	.folder-head {
		font-weight: 500;
	}

	.glyph {
		flex: none;
		font-size: 13px;
		width: 18px;
		text-align: center;
	}

	.label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.count {
		flex: none;
		font-size: 11px;
		color: var(--muted);
	}

	.fold-toggle {
		flex: none;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: 11px;
		cursor: pointer;
		padding: 0 2px;
		width: 14px;
	}

	.menu-btn {
		flex: none;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: 15px;
		line-height: 1;
		cursor: pointer;
		padding: 0 4px;
		border-radius: 4px;
	}

	.menu-btn:hover {
		color: var(--fg);
		background: var(--surface-2);
	}

	.rename-input {
		flex: 1;
		min-width: 0;
		padding: 3px 6px;
		border: 1px solid var(--accent);
		border-radius: 6px;
		background: var(--surface);
		color: var(--fg);
		font-size: 13px;
		outline: none;
	}

	.new-folder-input {
		flex: 0 1 auto;
		width: auto;
		margin: 2px 8px;
	}

	.group-label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
		padding: 8px 8px 4px;
	}

	.menu {
		position: absolute;
		right: 6px;
		top: calc(100% + 2px);
		z-index: 20;
		min-width: 140px;
		background: var(--surface);
		border: 1px solid var(--edge);
		border-radius: 10px;
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.14);
		padding: 4px;
		display: flex;
		flex-direction: column;
	}

	.menu button {
		text-align: left;
		padding: 7px 10px;
		border: none;
		background: transparent;
		border-radius: 6px;
		color: var(--fg);
		font-size: 12.5px;
		cursor: pointer;
	}

	.menu button:hover {
		background: var(--surface-2);
	}

	.menu button.danger {
		color: #ef4444;
	}

	.handle {
		position: absolute;
		top: 12px;
		left: 12px;
		z-index: 30;
		width: 34px;
		height: 34px;
		border: 1px solid var(--edge);
		border-radius: 9px;
		background: var(--surface);
		color: var(--fg);
		font-size: 16px;
		cursor: pointer;
		box-shadow: var(--node-shadow);
	}

	.handle:hover {
		background: var(--surface-2);
	}
</style>

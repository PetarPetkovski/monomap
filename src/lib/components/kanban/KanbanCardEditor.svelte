<script lang="ts">
	import { kanban } from '$lib/stores/kanban.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { fromDateInputValue, toDateInputValue } from '$lib/utils/due';

	const LABEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

	const board = $derived(kanban.editingCardBoardId ? workspace.boards.find((b) => b.id === kanban.editingCardBoardId) : undefined);
	const card = $derived(
		board?.columns.flatMap((c) => c.cards).find((c) => c.id === kanban.editingCardId)
	);

	const visible = $derived(!!card);

	let titleDraft = $state('');
	let descDraft = $state('');
	let labelText = $state('');
	let labelColor = $state(LABEL_COLORS[0]);
	let newCheckText = $state('');
	let checklistDrafts = $state<Record<string, string>>({});

	$effect(() => {
		const current = card;
		if (current) {
			titleDraft = current.title;
			descDraft = current.description ?? '';
		} else {
			titleDraft = '';
			descDraft = '';
		}
	});

	$effect(() => {
		const current = card;
		if (current) {
			for (const item of current.checklist ?? []) {
				if (checklistDrafts[item.id] === undefined) checklistDrafts[item.id] = item.text;
			}
		}
	});

	function addLabel() {
		const text = labelText.trim();
		if (!text || !card) return;
		workspace.addCardLabel(board!.id, card.id, { text, color: labelColor });
		labelText = '';
	}

	function commitNewCheck() {
		const text = newCheckText.trim();
		if (!text || !card) return;
		workspace.addChecklistItem(board!.id, card.id, text);
		newCheckText = '';
	}

	function dueValue(): string {
		return card?.dueDate ? toDateInputValue(card.dueDate) : '';
	}

	function setDue(value: string) {
		if (!card) return;
		workspace.setCardDueDate(board!.id, card.id, fromDateInputValue(value) || null);
	}

	function doneCount() {
		return card?.checklist?.filter((i) => i.done).length ?? 0;
	}
</script>

{#if visible}
	<div class="panel" role="complementary" aria-label="Card editor">
		<div class="sheet-handle" aria-hidden="true"></div>
		{#if card}
			<header>
				<input
					class="title-input"
					bind:value={titleDraft}
					placeholder="Card title"
					oninput={(e) => {
						titleDraft = e.currentTarget.value;
						workspace.updateCardTitle(board!.id, card.id, e.currentTarget.value);
					}}
				/>
				<button
					type="button"
					class="close"
					aria-label="Close card editor"
					onclick={() => kanban.closeCard()}
				>
					&times;
				</button>
			</header>

			<div class="body">
				{#if card.checklist?.length}
					<section class="section">
						<span class="label">Checklist</span>
						<div class="progress-track">
							<span class="progress" style:--pct={(doneCount() / card.checklist.length) * 100}></span>
							<span class="progress-text">{doneCount()}/{card.checklist.length}</span>
						</div>
					</section>
				{/if}

				<section class="section">
					<span class="label">Description</span>
					<textarea
						bind:value={descDraft}
						placeholder="Write a description&hellip;"
						spellcheck="false"
						oninput={(e) => {
							descDraft = e.currentTarget.value;
							workspace.setCardDescription(board!.id, card.id, e.currentTarget.value);
						}}
					></textarea>
				</section>

				<section class="section">
					<span class="label">Labels</span>
					{#if card.labels?.length}
						<div class="label-list">
							{#each card.labels as label, index (label.text + label.color)}
								<span class="label-chip" style:--chip={label.color}>
									{label.text}
									<button
										type="button"
										class="chip-remove"
										aria-label={`Remove label ${label.text}`}
										onclick={() => workspace.removeCardLabel(board!.id, card.id, index)}
									>
										&times;
									</button>
								</span>
							{/each}
						</div>
					{/if}
					<div class="label-form">
						<input
							bind:value={labelText}
							type="text"
							placeholder="New label"
							spellcheck="false"
							onkeydown={(e) => {
								if (e.key === 'Enter') addLabel();
							}}
						/>
						<div class="color-dots">
							{#each LABEL_COLORS as color (color)}
								<button
									type="button"
									class="dot"
									class:selected={labelColor === color}
									style:--dot={color}
									aria-label={`Label color ${color}`}
									onclick={() => (labelColor = color)}
								></button>
							{/each}
						</div>
						<button type="button" class="add" disabled={!labelText.trim()} onclick={addLabel}>
							Add
						</button>
					</div>
				</section>

				<section class="section">
					<span class="label">Due date</span>
					<div class="due-row">
						<input type="date" value={dueValue()} onchange={(e) => setDue(e.currentTarget.value)} />
						{#if card.dueDate}
							<button type="button" class="mini-btn" onclick={() => workspace.setCardDueDate(board!.id, card.id, null)}>
								Clear
							</button>
						{/if}
					</div>
				</section>

				<section class="section">
					<span class="label">Sub-tasks</span>
					{#if card.checklist?.length}
						<div class="check-list">
							{#each card.checklist as item (item.id)}
								<div class="check-row">
									<input
										type="checkbox"
										checked={item.done}
										onchange={() => workspace.toggleChecklistItem(board!.id, card.id, item.id)}
									/>
									<input
										class="check-text"
										bind:value={checklistDrafts[item.id]}
										oninput={(e) => {
											checklistDrafts[item.id] = e.currentTarget.value;
											workspace.updateChecklistItemText(board!.id, card.id, item.id, e.currentTarget.value);
										}}
										placeholder="Task&hellip;"
									/>
									<button
										type="button"
										class="chip-remove"
										aria-label="Remove task"
										onclick={() => workspace.removeChecklistItem(board!.id, card.id, item.id)}
									>
										&times;
									</button>
								</div>
							{/each}
						</div>
					{/if}
					<div class="check-add">
						<input
							bind:value={newCheckText}
							placeholder="Add a sub-task&hellip;"
							onkeydown={(e) => {
								if (e.key === 'Enter') commitNewCheck();
							}}
						/>
						<button type="button" class="add" disabled={!newCheckText.trim()} onclick={commitNewCheck}>
							Add
						</button>
					</div>
				</section>
			</div>
		{/if}
	</div>
{/if}

<style>
	.panel {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: 320px;
		max-width: 100%;
		background: var(--surface);
		border-left: 1px solid var(--edge);
		box-shadow: -8px 0 24px rgb(0 0 0 / 0.08);
		z-index: 60;
		display: flex;
		flex-direction: column;
	}

	.sheet-handle {
		display: none;
	}

	@media (max-width: 640px) {
		.panel {
			top: auto;
			bottom: 0;
			left: 0;
			right: 0;
			width: 100%;
			max-height: 76vh;
			border-left: none;
			border-top: 1px solid var(--edge);
			border-radius: 16px 16px 0 0;
			box-shadow: 0 -12px 32px rgb(0 0 0 / 0.18);
			padding-bottom: env(safe-area-inset-bottom);
			z-index: 70;
		}

		.sheet-handle {
			display: block;
			width: 44px;
			height: 4px;
			border-radius: 9999px;
			background: var(--edge);
			margin: 8px auto 0;
			flex: none;
		}
	}

	header {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 48px;
		padding: 0 10px 0 14px;
		border-bottom: 1px solid var(--edge);
	}

	.title-input {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		color: var(--fg);
		font-size: 14px;
		font-weight: 600;
		outline: none;
	}

	.close {
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: 20px;
		line-height: 1;
		cursor: pointer;
		padding: 2px 6px;
		border-radius: 6px;
	}

	.close:hover {
		color: var(--fg);
		background: var(--surface-2);
	}

	.body {
		flex: 1;
		overflow-y: auto;
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
	}

	textarea {
		min-height: 120px;
		padding: 10px 12px;
		border: 1px solid var(--edge);
		border-radius: 8px;
		background: var(--surface-2);
		color: var(--fg);
		font-size: 13px;
		line-height: 1.6;
		resize: vertical;
		outline: none;
		font-family: inherit;
	}

	textarea:focus {
		border-color: var(--accent);
	}

	.label-list {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.label-chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		font-weight: 600;
		color: #fff;
		background: var(--chip);
		padding: 2px 10px;
		border-radius: 9999px;
	}

	.chip-remove {
		border: none;
		background: transparent;
		color: inherit;
		font-size: 14px;
		line-height: 1;
		cursor: pointer;
		padding: 0 2px;
		opacity: 0.7;
	}

	.chip-remove:hover {
		opacity: 1;
	}

	.label-form {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.label-form input,
	.check-add input {
		flex: 1;
		min-width: 0;
		padding: 6px 10px;
		border-radius: 8px;
		border: 1px solid var(--edge);
		background: var(--surface-2);
		color: var(--fg);
		font-size: 12px;
		outline: none;
	}

	.label-form input:focus,
	.check-add input:focus {
		border-color: var(--accent);
	}

	.color-dots {
		display: flex;
		gap: 4px;
	}

	.dot {
		width: 18px;
		height: 18px;
		border-radius: 9999px;
		border: 2px solid var(--edge);
		background: var(--dot);
		cursor: pointer;
		padding: 0;
	}

	.dot.selected {
		border-color: var(--fg);
	}

	.add {
		padding: 6px 10px;
		border: none;
		border-radius: 8px;
		background: var(--accent);
		color: var(--accent-fg);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
	}

	.add:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.mini-btn {
		padding: 6px 10px;
		border: 1px solid var(--edge);
		border-radius: 7px;
		background: transparent;
		color: var(--fg);
		font-size: 12px;
		cursor: pointer;
	}

	.mini-btn:hover {
		background: var(--surface-2);
	}

	.due-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.due-row input {
		padding: 6px 10px;
		border-radius: 8px;
		border: 1px solid var(--edge);
		background: var(--surface-2);
		color: var(--fg);
		font-size: 12px;
		outline: none;
		color-scheme: light;
	}

	:global(.dark) .due-row input {
		color-scheme: dark;
	}

	.check-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.check-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.check-row input[type='checkbox'] {
		flex: none;
		accent-color: var(--accent);
	}

	.check-text {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		color: var(--fg);
		font-size: 13px;
		outline: none;
	}

	.check-add {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.progress-track {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.progress {
		flex: 1;
		height: 6px;
		border-radius: 9999px;
		background: var(--surface-2);
		overflow: hidden;
		position: relative;
	}

	.progress::after {
		content: '';
		position: absolute;
		inset: 0;
		width: calc(var(--pct) * 1%);
		background: var(--accent);
		border-radius: inherit;
	}

	.progress-text {
		flex: none;
		font-size: 11px;
		color: var(--muted);
	}
</style>

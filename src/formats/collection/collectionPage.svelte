<script lang="ts" module>
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action'
	import { flip } from 'svelte/animate'
	import {
		addBlueprintsToCollection,
		changeMemberBlueprintId,
		locateMember,
		openMember,
		removeMember,
		reorderMembers,
	} from '.'
	import {
		CollectionError,
		findOpenBlueprint,
		getBlueprintId,
		getBlueprintThumbnail,
	} from '../../collections'
	import { relativeTo } from '../../collections/collectionFile'
	import { getFsModule } from '../../constants'
	import { validateBlueprintId } from '../blueprint/settings'
	import EVENTS from '../../util/events'
	import { createScopedTranslator } from '../../util/lang'

	const localize = createScopedTranslator('collection.page')
	const FLIP_DURATION = 150

	type MemberStatus = 'missing' | 'unsaved' | 'open' | 'closed'

	interface MemberInfo {
		/** The member's path; svelte-dnd-action keys items by `id`. */
		id: string
		path: string
		[SHADOW_ITEM_MARKER_PROPERTY_NAME]?: boolean
		name: string
		blueprintId?: string
		status: MemberStatus
		thumbnail?: string
	}

	function getMemberInfo(path: string): MemberInfo {
		const name = PathModule.basename(path, '.ajblueprint')
		if (!getFsModule().existsSync(path)) return { id: path, path, name, status: 'missing' }
		const project = findOpenBlueprint(path)
		let blueprintId: string | undefined
		try {
			blueprintId = getBlueprintId(path)
		} catch (e) {
			if (!(e instanceof CollectionError)) throw e
		}
		const status = !project ? 'closed' : project.saved ? 'open' : 'unsaved'
		return { id: path, path, name, blueprintId, status, thumbnail: getBlueprintThumbnail(path) }
	}

	function selectOnMount(input: HTMLInputElement) {
		input.focus()
		input.select()
	}
</script>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte'

	let { project }: { project: ModelProject } = $props()

	let members = $state<MemberInfo[]>([])
	/** The member whose Blueprint ID is being edited on its card. */
	let editingPath = $state<string>()
	let draftId = $state('')
	const idError = $derived(editingPath === undefined ? undefined : checkId(editingPath, draftId))

	function refresh() {
		members = project.collection!.members.map(getMemberInfo)
	}
	refresh()

	const unsubscribe = EVENTS.UPDATE_COLLECTION.subscribe(changed => {
		if (changed === project) refresh()
	})
	onDestroy(unsubscribe)

	// Member tabs can be opened, edited or saved while this page is out of view.
	onMount(() => {
		window.addEventListener('focus', refresh)
		return () => window.removeEventListener('focus', refresh)
	})

	function openContextMenu(event: MouseEvent, member: MemberInfo) {
		const missing = member.status === 'missing'
		const index = project.collection!.members.indexOf(member.path)
		new Menu([
			{
				name: localize('members.open'),
				icon: 'open_in_new',
				condition: !missing,
				click: () => openMember(member.path),
			},
			{
				name: localize('members.change_id'),
				icon: 'edit',
				condition: !missing,
				click: () => startEditingId(member),
			},
			{
				name: localize('members.locate'),
				icon: 'search',
				condition: missing,
				click: () => locateMember(project, index),
			},
			'_',
			{
				name: localize('members.remove'),
				icon: 'delete',
				click: () => removeMember(project, index),
			},
		]).open(event)
	}

	function checkId(path: string, id: string) {
		const result = validateBlueprintId(id)
		if (result?.type === 'error') return result.message
		if (members.some(member => member.path !== path && member.blueprintId === id)) {
			return localize('members.duplicate_id')
		}
	}

	function startEditingId(member: MemberInfo) {
		draftId = member.blueprintId ?? ''
		editingPath = member.path
	}

	function finishEditingId(save: boolean) {
		const path = editingPath
		if (path === undefined) return
		editingPath = undefined
		const current = members.find(member => member.path === path)?.blueprintId
		if (save && draftId !== current) changeMemberBlueprintId(project, path, draftId)
	}

	function onIdKeydown(event: KeyboardEvent) {
		// Keeps the drag zone and Blockbench's keybinds from acting on typing.
		event.stopPropagation()
		if (event.key === 'Enter' && !idError) finishEditingId(true)
		else if (event.key === 'Escape') finishEditingId(false)
	}

	function finalize(items: MemberInfo[]) {
		members = items
		reorderMembers(
			project,
			items.map(item => item.path)
		)
	}

	function displayPath(path: string) {
		return project.save_path ? relativeTo(project.save_path, path) : path
	}
</script>

<div class="collection-page">
	<div class="card-grid">
		<div
			class="cards"
			use:dndzone={{
				items: members,
				flipDurationMs: FLIP_DURATION,
				dropTargetStyle: {},
				dragDisabled: editingPath !== undefined,
			}}
			onconsider={event => (members = event.detail.items)}
			onfinalize={event => finalize(event.detail.items)}
		>
			{#each members as member, index (member.id)}
				{@const storedIdError =
					member.blueprintId === undefined
						? undefined
						: checkId(member.path, member.blueprintId)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<article
					class="card"
					class:missing={member.status === 'missing'}
					class:invalid={storedIdError}
					title={member.path}
					animate:flip={{ duration: FLIP_DURATION }}
					ondblclick={() =>
						member.status !== 'missing' &&
						editingPath !== member.path &&
						openMember(member.path)}
					oncontextmenu={event => openContextMenu(event, member)}
				>
					{#if member[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
						<!-- The library hides the dragged card's slot; this marks where it will land. -->
						<div class="drop-placeholder" style="visibility: visible !important"></div>
					{:else}
						<div class="preview">
							{#if member.thumbnail}
								<img src={member.thumbnail} alt="" />
							{:else}
								<i class="material-icons placeholder"
									>{member.status === 'missing' ? 'warning' : 'view_in_ar'}</i
								>
							{/if}
							<span class="order">{index + 1}</span>
							{#if member.status !== 'closed'}
								<span class="badge {member.status}"
									>{localize(`status.${member.status}`)}</span
								>
							{/if}
						</div>
						<div class="details">
							<span class="name">{member.name}</span>
							{#if member.status === 'missing'}
								<span class="error-text small">{localize('members.missing')}</span>
							{:else if editingPath === member.path}
								<input
									class="id-input small"
									class:invalid={idError}
									bind:value={draftId}
									use:selectOnMount
									onkeydown={onIdKeydown}
									onblur={() => finishEditingId(!idError)}
								/>
								{#if idError}
									<span class="error-text small id-error">{@html idError}</span>
								{/if}
							{:else}
								<code class="small" class:error-text={storedIdError}
									>{member.blueprintId ?? '—'}</code
								>
								{#if storedIdError}
									<span class="error-text small id-error"
										>{@html storedIdError}</span
									>
								{/if}
							{/if}
							<span class="subtle small path">{displayPath(member.path)}</span>
						</div>
					{/if}
				</article>
			{/each}
		</div>

		<button class="add-card" onclick={() => addBlueprintsToCollection(project)}>
			<i class="material-icons">add</i>
			{localize('members.add')}
		</button>
	</div>

	<p class="subtle small footnote">{localize('members.removal_note')}</p>
</div>

<style>
	.collection-page {
		flex-grow: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 28px 40px;
		background: var(--color-back);
	}

	.header {
		display: flex;
		align-items: baseline;
		gap: 14px;
		margin-bottom: 18px;
	}

	.subtle {
		margin: 0;
		color: var(--color-subtle_text);
	}

	.small {
		font-size: 0.75em;
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 12px;
	}

	.card {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-radius: 5px;
		background: var(--color-elevated);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		cursor: pointer;
	}

	.card:hover {
		background: var(--color-selected);
	}

	.cards {
		grid-column: 1 / -1;
		display: grid;
		grid-template-columns: subgrid;
		gap: inherit;
	}

	.cards:empty {
		display: none;
	}

	.drop-placeholder {
		flex-grow: 1;
		min-height: 180px;
		border: 2px dashed var(--color-accent);
		border-radius: 5px;
	}

	.card.missing,
	.card.invalid {
		box-shadow: 0 0 0 1px var(--color-error, #ff5555);
	}

	.preview {
		position: relative;
		height: 110px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-dark);
	}

	.preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.placeholder {
		width: 44px;
		max-width: 44px;
		height: 44px;
		font-size: 44px;
		line-height: 44px;
		color: var(--color-subtle_text);
	}

	.card.missing .placeholder,
	.error-text {
		color: var(--color-error, #ff5555);
	}

	.order {
		position: absolute;
		top: 6px;
		left: 6px;
		min-width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		background: var(--color-button);
		font-size: 0.85em;
	}

	.badge {
		position: absolute;
		top: 6px;
		right: 6px;
		padding: 0 8px;
		border-radius: 10px;
		font-size: 0.85em;
	}

	.badge.open {
		background: color-mix(in srgb, var(--color-accent) 30%, var(--color-ui));
	}

	.badge.unsaved {
		background: color-mix(in srgb, var(--color-warning) 35%, var(--color-ui));
	}

	.badge.missing {
		background: color-mix(in srgb, var(--color-error, #ff5555) 35%, var(--color-ui));
	}

	.details {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px 12px 10px;
		min-width: 0;
	}

	.name {
		color: var(--color-light);
	}

	.id-input {
		width: 100%;
		padding: 0 4px;
		font-family: var(--font-code);
		background: var(--color-back);
		border: 1px solid var(--color-border);
	}

	.id-error :global(p) {
		margin: 0;
	}

	.id-input.invalid {
		border-color: var(--color-error, #ff5555);
	}

	.path {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.add-card {
		margin: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 6px;
		grid-column: -2;
	}

	.footnote {
		margin-top: 18px;
	}
</style>

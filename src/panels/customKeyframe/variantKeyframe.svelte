<script lang="ts" module>
	import { untrack } from 'svelte'
	import { SHADOW_ITEM_MARKER_PROPERTY_NAME, dndzone } from 'svelte-dnd-action'
	import { flip } from 'svelte/animate'
	import { KEYFRAME_DATA_POINTS } from '../../mods/customKeyframes'
	import CustomCodeJar from '../../svelteComponents/customCodeJar.svelte'
	import { localize as translate } from '../../util/lang'
	import { editKeyframe, keyframeTextEdit } from './keyframeEdit'
	import { Variant } from '../../variants'

	interface StackItem {
		/** The Variant's UUID. Unique, since a Variant appears in a stack at most once. */
		id: string
		[SHADOW_ITEM_MARKER_PROPERTY_NAME]?: boolean
	}

	const FLIP_DURATION = 100
</script>

<script lang="ts">
	let { keyframe }: { keyframe: _Keyframe } = $props()

	// The panel is remounted for each selected keyframe, so these only need its initial values.
	// Edited as UUIDs, so Variants that were deleted stay visible until removed.
	let items: StackItem[] = $state(
		untrack(() =>
			((keyframe.data_points[0]?.[KEYFRAME_DATA_POINTS.VARIANTS] ?? []) as string[]).map(
				id => ({ id })
			)
		)
	)
	let executeCondition = $state(untrack(() => keyframe.execute_condition ?? ''))

	$effect(() => {
		keyframe.execute_condition = executeCondition
	})

	function save(next: StackItem[]) {
		items = next
		editKeyframe(keyframe, () => {
			const dataPoint = keyframe.data_points[0]
			if (dataPoint) dataPoint[KEYFRAME_DATA_POINTS.VARIANTS] = next.map(item => item.id)
		})
	}

	function openAddMenu(event: MouseEvent) {
		const available = Variant.all.filter(
			variant => !items.some(item => item.id === variant.uuid)
		)
		if (!available.length) {
			Blockbench.showQuickMessage(translate('variant_stack_editor.all_variants_added'))
			return
		}
		new Menu(
			available.map(variant => ({
				name: variant.displayName,
				icon: 'texture',
				click: () => save([...items, { id: variant.uuid }]),
			}))
		).open(event)
	}
</script>

<div class="section-header" title={translate('panel.keyframe.variant.description')}>
	<span>{translate('panel.keyframe.variant.title')}</span>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="in_list_button"
		title={translate('variant_stack_editor.add_variant')}
		onclick={openAddMenu}
	>
		<i class="material-icons">add</i>
	</div>
</div>

{#if items.length}
	<ul
		use:dndzone={{ items, flipDurationMs: FLIP_DURATION, dropTargetStyle: {} }}
		onconsider={e => (items = e.detail.items)}
		onfinalize={e => save(e.detail.items)}
	>
		{#each items as item (item.id)}
			{@const variant = Variant.getByUUID(item.id)}
			<li class="row" animate:flip={{ duration: FLIP_DURATION }}>
				{#if item[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
					<div class="drop-marker"></div>
				{:else}
					<i class="material-icons handle">drag_indicator</i>
					<span class="name" class:missing={!variant}>
						{variant?.displayName ?? translate('variant_stack_editor.missing_variant')}
					</span>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="in_list_button"
						title={translate('panel.keyframe.remove')}
						onclick={() => save(items.filter(other => other !== item))}
					>
						<i class="material-icons">clear</i>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{:else}
	<div class="empty">{translate('panel.keyframe.variant.empty')}</div>
{/if}

<div class="bar flex custom-bar" use:keyframeTextEdit={keyframe}>
	<label
		for="execute_condition"
		class="undefined"
		style="font-weight: unset;"
		title={translate('panel.keyframe.execute_condition.description')}
	>
		{translate('panel.keyframe.execute_condition.title')}
	</label>
	<CustomCodeJar
		bind:value={executeCondition}
		placeholder={'if score @s matches 1..'}
		syntax="mcfunction"
	/>
</div>

<style>
	.section-header {
		display: flex;
		align-items: center;
		height: 30px;
		padding: 2px 4px 2px 8px;
		background-color: var(--color-elevated);
	}
	.section-header > span {
		flex-grow: 1;
	}
	ul {
		margin: 0;
		padding: 0;
		background: var(--color-dark);
	}
	.row {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 31px;
		padding: 0 4px 0 8px;
		cursor: grab;
		background: var(--color-back);
	}
	.row:hover {
		background-color: var(--color-button);
	}
	.handle {
		font-size: 18px;
		color: var(--color-subtle_text);
	}
	.name {
		flex: 1 1 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.missing,
	.empty {
		color: var(--color-subtle_text);
		font-style: italic;
	}
	.empty {
		padding: 4px 8px;
	}
	.drop-marker {
		width: 100%;
		border-top: 2px solid var(--color-accent);
	}
	.custom-bar {
		flex-direction: column;
	}
</style>

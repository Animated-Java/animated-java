<script lang="ts">
	import { onMount } from 'svelte'
	import type { TintSource } from '../../systems/minecraft/itemDefinitions'
	import {
		changeTintSourceType,
		createDefaultTintSource,
		getAvailableTintSourceTypes,
		isTintSourceTypeAvailable,
		normalizeTintSource,
		TINT_SOURCE_TYPES,
		type TintSourceType,
	} from '../../systems/minecraft/tintSources'
	import { localize } from '../../util/lang'
	import TintColorInput from './tintColorInput.svelte'
	import TintField from './tintField.svelte'
	import TintNumberInput from './tintNumberInput.svelte'

	interface Props {
		itemTints: TintSource[]
		targetVersion: string
	}

	let { itemTints, targetVersion }: Props = $props()

	const availableTypes = $derived(getAvailableTintSourceTypes(targetVersion))

	let tints = $state<TintSource[]>([])
	/** The one tint showing its details, if any. */
	let expanded = $state<TintSource | null>(null)
	let initialized = $state(false)

	onMount(() => {
		tints = itemTints.map(normalizeTintSource)
		initialized = true
	})

	// Element ids must stay unique as rows are removed, so they can't be based on the index.
	const elementIds = new WeakMap<TintSource, string>()
	const getElementId = (tint: TintSource) => {
		let id = elementIds.get(tint)
		if (!id) elementIds.set(tint, (id = `tint-${guid().slice(0, 8)}`))
		return id
	}

	const getTypeKey = (type: TintSourceType) => type.replace('minecraft:', '')

	const getTypeName = (type: TintSourceType) =>
		TINT_SOURCE_TYPES[type]
			? localize(`dialog.item_properties.tint_types.${getTypeKey(type)}`)
			: type

	const getTypeDescription = (type: TintSourceType) =>
		TINT_SOURCE_TYPES[type]
			? localize(`dialog.item_properties.tint_type_descriptions.${getTypeKey(type)}`)
			: ''

	const hasAlpha = (type: TintSourceType) => TINT_SOURCE_TYPES[type]?.alpha ?? false

	const addTint = () => {
		tints.push(createDefaultTintSource('minecraft:constant'))
		expanded = tints.at(-1)!
	}

	const removeTint = (tint: TintSource) => {
		if (expanded === tint) expanded = null
		tints.splice(tints.indexOf(tint), 1)
	}

	const toggleExpanded = (tint: TintSource) => {
		expanded = expanded === tint ? null : tint
	}

	/** Mounts Blockbench's own select, listing the current type too if it's unsupported. */
	const mountTypeSelect = (node: HTMLDivElement, tint: TintSource) => {
		const types = availableTypes.includes(tint.type)
			? availableTypes
			: [tint.type, ...availableTypes]
		const select = new Interface.CustomElements.SelectInput(`${getElementId(tint)}-type`, {
			options: Object.fromEntries(types.map(type => [type, getTypeName(type)])),
			value: tint.type,
			onChange() {
				const type = select.node.getAttribute('value') as TintSourceType | null
				if (!type || type === tint.type) return
				const index = tints.indexOf(tint)
				tints[index] = changeTintSourceType(tint, type)
				if (expanded === tint) expanded = tints[index]
			},
		})
		node.appendChild(select.node)
	}

	$effect(() => {
		if (!initialized) {
			return
		}
		itemTints.splice(0, itemTints.length, ...$state.snapshot(tints))
	})
</script>

{#snippet fields(tint: TintSource, detailed: boolean)}
	{@const id = getElementId(tint)}
	{#if tint.type === 'minecraft:constant'}
		<TintField
			id={`${id}-color`}
			label={localize('dialog.item_properties.color')}
			description={localize('dialog.item_properties.field_descriptions.color')}
			{detailed}
		>
			<TintColorInput
				id={`${id}-color`}
				label={localize('dialog.item_properties.color')}
				alpha={false}
				value={tint.value as number}
				onChange={value => (tint.value = value)}
			/>
		</TintField>
	{:else if tint.type === 'minecraft:grass'}
		<TintField
			id={`${id}-temperature`}
			label={localize('dialog.item_properties.temperature')}
			description={localize('dialog.item_properties.field_descriptions.temperature')}
			{detailed}
			inlineLabel
		>
			<TintNumberInput
				id={`${id}-temperature`}
				value={tint.temperature}
				min={0}
				max={1}
				step={0.05}
				onChange={value => (tint.temperature = value)}
			/>
		</TintField>
		<TintField
			id={`${id}-downfall`}
			label={localize('dialog.item_properties.downfall')}
			description={localize('dialog.item_properties.field_descriptions.downfall')}
			{detailed}
			inlineLabel
		>
			<TintNumberInput
				id={`${id}-downfall`}
				value={tint.downfall}
				min={0}
				max={1}
				step={0.05}
				onChange={value => (tint.downfall = value)}
			/>
		</TintField>
	{:else}
		{#if tint.type === 'minecraft:custom_model_data'}
			<TintField
				id={`${id}-index`}
				label={localize('dialog.item_properties.index')}
				description={localize('dialog.item_properties.field_descriptions.index')}
				{detailed}
				inlineLabel
			>
				<div class="index-input">
					<TintNumberInput
						id={`${id}-index`}
						value={tint.index ?? 0}
						min={0}
						integer
						onChange={value => (tint.index = value)}
					/>
				</div>
			</TintField>
		{/if}
		<TintField
			id={`${id}-default`}
			label={localize('dialog.item_properties.default_color')}
			description={localize(
				`dialog.item_properties.field_descriptions.default_color.${getTypeKey(tint.type)}`
			)}
			{detailed}
		>
			<TintColorInput
				id={`${id}-default`}
				label={localize('dialog.item_properties.default_color')}
				alpha={hasAlpha(tint.type)}
				value={tint.default as number}
				onChange={value => (tint.default = value)}
			/>
		</TintField>
	{/if}
{/snippet}

<div class="item-model-properties">
	<div class="intro">
		<p>{localize('dialog.item_properties.description')}</p>
		<span class="target">
			{localize('dialog.item_properties.target')}: <span>{targetVersion}</span>
		</span>
	</div>

	<div class="tint-table">
		{#if tints.length === 0}
			<p class="empty-state">{localize('dialog.item_properties.empty_state')}</p>
		{:else}
			<div class="tint-row table-header">
				<span></span>
				<span class="index">#</span>
				<span>{localize('dialog.item_properties.column.type')}</span>
				<span>{localize('dialog.item_properties.column.value')}</span>
				<span></span>
			</div>
		{/if}

		{#each tints as tint, index (tint)}
			{@const isExpanded = expanded === tint}
			{@const supported = isTintSourceTypeAvailable(tint.type, targetVersion)}
			<div class="tint" class:expanded={isExpanded} class:unsupported={!supported}>
				<div class="tint-row">
					<button
						class="icon-button"
						title={localize(
							isExpanded
								? 'dialog.item_properties.collapse_tint'
								: 'dialog.item_properties.expand_tint'
						)}
						onclick={() => toggleExpanded(tint)}
					>
						<i class="material-icons">{isExpanded ? 'expand_more' : 'chevron_right'}</i>
					</button>
					<span class="index">{index}</span>
					<div class="tint-type" use:mountTypeSelect={tint}></div>
					{#if isExpanded}
						<span class="summary">{getTypeDescription(tint.type)}</span>
					{:else}
						<div class="inline-fields">{@render fields(tint, false)}</div>
					{/if}
					<button
						class="icon-button"
						title={localize('dialog.item_properties.remove_tint')}
						onclick={() => removeTint(tint)}
					>
						<i class="material-icons">delete</i>
					</button>
				</div>

				{#if !supported}
					<p class="warning">
						<i class="material-icons">warning</i>
						{localize(
							'dialog.item_properties.unsupported_type',
							getTypeName(tint.type),
							targetVersion
						)}
					</p>
				{/if}

				{#if isExpanded}
					<div class="details">
						{@render fields(tint, true)}
						{#if hasAlpha(tint.type)}
							<p class="note">
								<i class="material-icons">info</i>
								{localize('dialog.item_properties.alpha_note')}
							</p>
						{/if}
					</div>
				{/if}
			</div>
		{/each}

		<button class="add-tint" onclick={addTint}>
			<i class="material-icons">add</i>
			{localize('dialog.item_properties.add_tint')}
		</button>
	</div>
</div>

<style>
	.item-model-properties {
		max-height: 75vh;
		overflow-y: auto;
		padding: 0 8px;
	}

	.intro {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 10px;
	}

	.intro p {
		margin: 0;
		color: var(--color-subtle_text);
	}

	.target {
		flex-shrink: 0;
		padding: 2px 8px;
		border-radius: 3px;
		font-size: 0.9em;
		background: var(--color-back);
		color: var(--color-subtle_text);
	}

	.target span {
		color: var(--color-text);
	}

	.tint-table {
		display: flex;
		flex-direction: column;
		border-radius: 4px;
		background: var(--color-back);
	}

	.tint-row {
		display: grid;
		grid-template-columns: 28px 24px 190px minmax(0, 1fr) 28px;
		align-items: center;
		gap: 8px;
		min-height: 40px;
		padding: 0 8px 0 4px;
	}

	.table-header {
		min-height: 30px;
		font-size: 0.85em;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-subtle_text);
	}

	.tint {
		border-top: 1px solid var(--color-border);
		border-left: 3px solid transparent;
		background: var(--color-ui);
	}

	.tint.expanded {
		border-left-color: var(--color-accent);
	}

	.tint.expanded > .tint-row {
		background: var(--color-selected);
	}

	.tint.unsupported {
		background: color-mix(in srgb, var(--color-warning) 8%, var(--color-ui));
	}

	.tint.unsupported .tint-type :global(.bb-select) {
		box-shadow: inset 0 0 0 1px var(--color-warning);
	}

	.index {
		text-align: center;
		color: var(--color-subtle_text);
	}

	.tint-type :global(.bb-select) {
		width: 100%;
	}

	.inline-fields {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.index-input {
		width: 72px;
		flex-shrink: 0;
	}

	.details .index-input {
		width: 100%;
	}

	.summary {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: 0.9em;
		color: var(--color-subtle_text);
	}

	.icon-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		min-width: 28px;
		height: 28px;
		padding: 0;
		background: none;
		box-shadow: none;
		color: var(--color-subtle_text);
	}

	.icon-button:hover {
		color: var(--color-light);
	}

	.icon-button i {
		font-size: 20px;
	}

	.details {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 14px 16px 16px 40px;
	}

	.warning,
	.note {
		display: flex;
		gap: 6px;
		margin: 0;
		font-size: 0.9em;
		line-height: 1.4;
	}

	.warning {
		align-items: center;
		padding: 0 12px 8px 72px;
		color: var(--color-warning);
	}

	.note {
		padding: 10px 12px;
		border-radius: 4px;
		background: var(--color-back);
		color: var(--color-subtle_text);
	}

	.warning i,
	.note i {
		font-size: 18px;
	}

	.note i {
		color: var(--color-accent);
	}

	.empty-state {
		margin: 0;
		padding: 10px 12px;
		color: var(--color-subtle_text);
	}

	.add-tint {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 36px;
		padding: 0 12px;
		border-top: 1px solid var(--color-border);
		border-radius: 0 0 4px 4px;
		background: none;
		box-shadow: none;
		color: var(--color-subtle_text);
		text-align: left;
	}

	.add-tint:hover {
		color: var(--color-light);
	}

	.add-tint i {
		font-size: 20px;
	}
</style>

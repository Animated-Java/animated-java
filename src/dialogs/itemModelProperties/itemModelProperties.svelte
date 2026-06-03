<script lang="ts">
	import { onMount } from 'svelte'
	import type { TintSource } from '../../systems/minecraft/itemDefinitions'
	import { localize } from '../../util/lang'

	interface Props {
		itemTints: TintSource[]
	}

	let { itemTints }: Props = $props()

	const getInitialTintValues = (tints: TintSource[]) => {
		return tints.flatMap(tint =>
			tint.type === 'minecraft:constant' && typeof tint.value === 'number'
				? [Math.trunc(tint.value)]
				: []
		)
	}

	let tintValues = $state<number[]>([])
	let initialized = $state(false)

	onMount(() => {
		tintValues = getInitialTintValues(itemTints)
		initialized = true
	})

	const toConstantTint = (value: number): TintSource => {
		return {
			type: 'minecraft:constant',
			value: Math.trunc(Number.isFinite(value) ? value : 0),
		}
	}

	const addTint = () => {
		tintValues.push(0)
	}

	const removeTint = (index: number) => {
		tintValues.splice(index, 1)
	}

	const normalizeTintValue = (index: number) => {
		tintValues[index] = Math.trunc(Number.isFinite(tintValues[index]) ? tintValues[index] : 0)
	}

	const getTintLabel = (index: number) =>
		localize('dialog.item_properties.tint_label', String(index))

	$effect(() => {
		if (!initialized) {
			return
		}
		itemTints.splice(0, itemTints.length, ...tintValues.map(toConstantTint))
	})
</script>

<div class="item-model-properties">
	<div class="header-row">
		<h3>{localize('dialog.item_properties.tint_constants')}</h3>
		<button onclick={addTint}>{localize('dialog.item_properties.add_tint')}</button>
	</div>
	<p class="description">{@html localize('dialog.item_properties.description')}</p>

	{#if tintValues.length === 0}
		<p class="empty-state">{localize('dialog.item_properties.empty_state')}</p>
	{:else}
		<div class="tint-list">
			{#each tintValues as _, index}
				<div class="tint-row">
					<label for={`tint-value-${index}`}>{getTintLabel(index)}</label>
					<input
						id={`tint-value-${index}`}
						type="number"
						step="1"
						bind:value={tintValues[index]}
						onchange={() => normalizeTintValue(index)}
					/>
					<button onclick={() => removeTint(index)}
						>{localize('dialog.item_properties.remove_tint')}</button
					>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.item-model-properties {
		max-height: 75vh;
		overflow-y: auto;
	}

	.header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin: 0 24px 12px 24px;
	}

	.header-row h3 {
		margin: 0;
	}

	.description {
		margin: 0 24px 12px 24px;
		color: var(--color-subtle_text);
		line-height: 1.4;
	}

	.tint-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 0 24px;
	}

	.tint-row {
		display: grid;
		grid-template-columns: minmax(96px, auto) 1fr auto;
		align-items: center;
		gap: 8px;
	}

	.tint-row input {
		width: 100%;
		background: var(--color-back);
		border: 1px solid var(--color-border);
		padding: 0px 6px;
	}

	.empty-state {
		margin: 0 24px;
		color: var(--color-subtle_text);
	}
</style>

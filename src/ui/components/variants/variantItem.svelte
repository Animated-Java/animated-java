<script lang="ts">
	import { onDestroy } from 'svelte'
	import * as events from '../../../events'
	import { translate } from '../../../util/translation'
	import { Variant, VariantsContainer } from '../../../variants'
	import { state, VARIANT_MENU, variantPropertiesAction } from '../../ajVariantsPanel'
	import FlatIconButton from '../buttons/flatIconButton.svelte'

	export let variant: Variant
	export let deleteVariant: (variant: Variant) => void
	export let variantsContainer: VariantsContainer

	const translations = {
		items: translate('animated_java.panels.variants.items'),
		edit_variant: translate('animated_java.panels.variants.edit_variant'),
		default_variant: translate('animated_java.panels.variants.default_variant'),
		delete_variant: translate('animated_java.panels.variants.delete_variant'),
		delete_default_variant: translate('animated_java.panels.variants.delete_default_variant'),
	}

	let selected: boolean
	let unsubs: any[] = []
	$: selected = variantsContainer.selectedVariant?.uuid === variant.uuid

	unsubs.push(
		variantsContainer.subscribe(event => {
			// selected needs to be updated in the svelte state. Doesn't matter what it's value is.
			if (event.type === 'select') selected = false
		})
	)

	unsubs.push(
		events.VARIANT_PROPERTIES_UPDATE.subscribe(() => {
			variant = variant
		})
	)

	function openVariantMenu(event: MouseEvent) {
		state.recentlyClickedVariant = variant
		VARIANT_MENU.open(event)
	}

	function openVariantProperties(event: MouseEvent) {
		state.recentlyClickedVariant = variant
		variantPropertiesAction.click(event)
	}

	function setDefault(variant: Variant) {
		variantsContainer.defaultVariant = variant
	}

	function handleInteraction(event: Event) {
		return variantsContainer.select(variant)
	}

	onDestroy(() => {
		unsubs.forEach(u => u())
	})
</script>

<div
	class="variant-container"
	title={translations.items}
	style={selected ? 'background-color:var(--color-selected);' : ''}
	on:click={handleInteraction}
	on:contextmenu|stopPropagation={e => openVariantMenu(e)}
	on:keydown={e => {
		if (e.key === 'Enter') handleInteraction(e)
	}}
>
	<p class="variant-name">{variant.name}</p>
	{#if variant.default}
		<FlatIconButton onClick={() => {}} icon="star" title={translations.default_variant} />
	{/if}
	<FlatIconButton onClick={openVariantProperties} icon="edit" title={translations.edit_variant} />
	<FlatIconButton
		onClick={() => deleteVariant(variant)}
		icon="delete"
		title={variant.default ? translations.delete_default_variant : translations.delete_variant}
		iconStyle={variant.default ? 'color: var(--color-subtle_text)' : ''}
	/>
</div>

<style>
	div.variant-container {
		display: flex;
		flex-direction: row;
		padding: 0.1em;
	}

	p.variant-name {
		display: flex;
		align-items: center;
		flex-grow: 1;
	}

	div.variant-container:hover {
		color: var(--color-light) !important;
	}
</style>

<script lang="ts">
	import { onDestroy } from 'svelte'
	import { events } from '../../../util/events'
	import { translate } from '../../../util/translation'
	import { Variant, VariantsContainer } from '../../../variants'
	import { state, variantMenu, variantPropertiesAction } from '../../ajVariantsPanel'

	export let variant: Variant
	export let deleteVariant: (variant: Variant) => void
	export let variantsContainer: VariantsContainer
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
		events.variantPropertiesUpdate.subscribe(() => {
			variant = variant
		})
	)

	function openVariantMenu(event: MouseEvent) {
		state.recentlyClickedVariant = variant
		variantMenu.open(event)
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
	title={translate('animated_java.panels.variants.items')}
	style={selected ? 'background-color:var(--color-selected);' : ''}
	on:click={handleInteraction}
	on:contextmenu|stopPropagation={e => openVariantMenu(e)}
	on:keydown={e => {
		if (e.key === 'Enter') handleInteraction(e)
	}}
>
	<p class="variant-name">{variant.name}</p>
	<button
		on:click|stopPropagation={e => openVariantProperties(e)}
		title={translate('animated_java.panels.variants.edit_variant')}
	>
		<span class="material-icons">edit</span>
	</button>
	<button
		on:click|stopPropagation={() => setDefault(variant)}
		title={translate('animated_java.panels.variants.set_default')}
		disabled={variant.default}
	>
		<span class="material-icons" style={variant.default ? 'color: var(--color-accent)' : ''}>
			star
		</span>
	</button>
	<button
		on:click|stopPropagation={() => deleteVariant(variant)}
		title={variant.default
			? translate('animated_java.panels.variants.delete_variant_disabled')
			: translate('animated_java.panels.variants.delete_variant')}
		disabled={variant.default}
	>
		<span
			class="material-icons"
			style={variant.default ? 'color: var(--color-subtle_text)' : ''}
		>
			delete
		</span>
	</button>
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

	button {
		all: unset !important;

		display: flex !important;
		justify-content: center !important;
		align-content: center !important;
		flex-wrap: wrap !important;

		margin-right: 0.2em !important;
	}

	.material-icons {
		margin: 0px;
	}

	div.variant-container:hover {
		color: var(--color-light) !important;
	}
</style>

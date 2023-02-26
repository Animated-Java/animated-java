<script lang="ts">
	import { onDestroy } from 'svelte'
	import { translate } from '../../../util/translation'
	import { Variant, VariantsContainer } from '../../../variants'

	export let variant: Variant
	export let deleteVariant: (variant: Variant) => void
	export let variantsContainer: VariantsContainer
	let selected: boolean
	$: selected = variantsContainer.selectedVariant?.name === variant.name

	const unsub = variantsContainer.subscribe(event => {
		// selected needs to be updated in the svelte state. Doesn't matter what it's value is.
		if (event.type === 'select') selected = false
	})

	onDestroy(() => {
		unsub()
	})
</script>

<div
	class="variant-container"
	title={translate('animated_java.panels.variants.items')}
	style={selected ? 'background-color:var(--color-selected);' : ''}
	on:click={() => variantsContainer.select(variant)}
>
	<p class="variant-name">{variant.name}</p>
	<button
		on:click|stopPropagation={() => console.log('Open variants panel!')}
		title={translate('animated_java.panels.variants.edit_variant')}
	>
		<span class="material-icons">edit</span>
	</button>
	<button
		on:click|stopPropagation={() => deleteVariant(variant)}
		title={translate('animated_java.panels.variants.delete_variant')}
		disabled={variant.name === 'default'}
	>
		<span
			class="material-icons"
			style={variant.name === 'default' ? 'color: var(--color-subtle_text)' : ''}
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

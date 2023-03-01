<script lang="ts">
	import VariantComponent from './variants/variantItem.svelte'
	import { Variant, VariantsContainer } from '../../variants'
	import * as events from '../../util/events'
	import { ajModelFormat } from '../../modelFormat'
	import { state, variantPanelMenu } from '../ajVariantsPanel'
	import { onDestroy } from 'svelte'

	let variantsContainer: VariantsContainer | undefined
	let update: number = 0
	let unsubs: any[] = []

	function deleteVariant(variant: Variant) {
		if (!variantsContainer) return
		variantsContainer.removeVariant(variant)
	}

	let unsub: any
	unsubs.push(
		events.postSelectProject.subscribe(project => {
			if (variantsContainer) {
				if (unsub) unsub()
				variantsContainer = undefined
			}
			console.log(project)
			if (!(project.format.id === ajModelFormat.id)) return

			variantsContainer = project.animated_java_variants!
			unsub = variantsContainer.subscribe(() => {
				update++
			})
			update++
		})
	)

	async function waitForProject() {
		while (!variantsContainer) {
			await new Promise<void>(r => setTimeout(r, 100))
		}
	}

	onDestroy(() => {
		unsubs.forEach(u => u())
	})
</script>

{#await waitForProject()}
	<div class="container">
		<p>Loading...</p>
	</div>
{:then}
	<div class="container" on:contextmenu|stopPropagation={e => variantPanelMenu.open(e)}>
		{#key update}
			{#if variantsContainer}
				{#each variantsContainer.variants as variant}
					<VariantComponent {variant} {deleteVariant} bind:variantsContainer />
				{/each}
			{/if}
		{/key}
	</div>
{:catch}
	<div class="container">
		<p>Error loading Variants</p>
	</div>
{/await}

<style>
	div.container {
		display: flex;
		flex-direction: column;
		background-color: var(--color-back);
		align-items: stretch;
		overflow-y: auto;
		min-height: 10em;
		max-height: 20em;
	}
</style>

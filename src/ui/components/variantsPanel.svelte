<script lang="ts">
	import VariantComponent from './variants/variant.svelte'
	import { Variant, VariantsContainer } from '../../variants'
	import { events } from '../../util/events'
	import { ajModelFormat } from '../../modelFormat'

	let variantsContainer: VariantsContainer | undefined
	let update: number = 0
	let unsub: any

	function deleteVariant(variant: Variant) {
		if (!variantsContainer) return
		variantsContainer.removeVariant(variant)
	}

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

	async function waitForProject() {
		while (!variantsContainer) {
			await new Promise<void>(r => setTimeout(r, 100))
		}
	}
</script>

{#await waitForProject()}
	<div class="container">
		<p>Loading...</p>
	</div>
{:then}
	<div class="container">
		{#key update}
			{#if variantsContainer}
				{#each variantsContainer.all as variant}
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
		min-height: 10em;
	}
</style>

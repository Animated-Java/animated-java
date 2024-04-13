<script lang="ts" context="module">
	import { Valuable } from '../../util/stores'
	import { translate } from '../../util/translation'
	import { Variant } from '../../variants'
	import { getKeyframeVariant, setKeyframeVariant } from '../../mods/customKeyframesMod'
</script>

<script lang="ts">
	export let selectedKeyframe: _Keyframe
	const keyframeValue = new Valuable<string>(getKeyframeVariant(selectedKeyframe) as string)
	let selectContainer: HTMLDivElement

	keyframeValue.subscribe(value => {
		setKeyframeVariant(selectedKeyframe, value)
	})

	const options = Object.fromEntries(
		Variant.all.map(variant => [variant.uuid, variant.displayName]),
	)

	// @ts-ignore
	const selectInput = new Interface.CustomElements.SelectInput('keyframe-variant-selector', {
		options,
		value: keyframeValue.get(),
		onChange() {
			keyframeValue.set(selectInput.node.getAttribute('value'))
			Animator.preview()
		},
	})

	requestAnimationFrame(() => {
		selectContainer.appendChild(selectInput.node)
	})
</script>

<label for="variant_input" class="undefined" style="font-weight: unset;">
	{translate('effect_animator.keyframes.variant')}
</label>

<div class="select-container" bind:this={selectContainer} />

<!-- <select bind:value={$keyframeValue}>
	{#each Variant.all as variant}
		<option value={variant.uuid}>{variant.displayName}</option>
	{/each}
</select> -->

<style>
	.select-container {
		flex-grow: 1;
		height: 30px;
		padding-left: 8px;
	}
</style>

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

<div class="bar flex">
	<label
		for="variant_input"
		class="undefined"
		style="font-weight: unset; width: fit-content;"
		title={translate('panel.keyframe.variant.description')}
	>
		{translate('panel.keyframe.variant.title')}
	</label>
	<div class="select-container" bind:this={selectContainer} />
</div>

<style>
	.select-container {
		flex-grow: 1;
		height: 30px;
		padding-left: 8px;
	}
</style>

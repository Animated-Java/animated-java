<script lang="ts">
	import { getKeyframeVariant, setKeyframeVariant } from '../../mods/customKeyframesMod'
	import { Valuable } from '../../util/stores'
	import { translate } from '../../util/translation'
	import { Variant } from '../../variants'
	export let selectedKeyframe: _Keyframe
	const keyframeValue = new Valuable<string>(getKeyframeVariant(selectedKeyframe) as string)
	let selectContainer: HTMLDivElement

	if (!Variant.all.find(v => v.uuid === keyframeValue.get())) {
		console.warn('Keyframe variant not found. Resetting to default.')
		const uuid = Variant.getDefault().uuid
		setKeyframeVariant(selectedKeyframe, uuid)
		keyframeValue.set(uuid)
	}

	keyframeValue.subscribe(value => {
		setKeyframeVariant(selectedKeyframe, value)
	})

	const options = Object.fromEntries(
		Variant.all.map(variant => [variant.uuid, variant.displayName])
	)

	// @ts-ignore
	const selectInput = new Interface.CustomElements.SelectInput('keyframe-variant-selector', {
		options,
		value: keyframeValue.get(),
		onChange() {
			const value = selectInput.node.getAttribute('value')
			if (value == undefined) {
				console.warn('Variant value is undefined')
				return
			}
			keyframeValue.set(value)
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

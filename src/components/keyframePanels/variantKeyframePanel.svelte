<script lang="ts">
	import { getKeyframeVariant, setKeyframeVariant } from '../../mods/customKeyframes'
	import { Valuable } from '../../util/stores'
	import { translate } from '../../util/translation'
	import { Variant } from '../../variants'
	export let selectedKeyframe: _Keyframe
	const KEYFRAME_VALUE = new Valuable<string>(getKeyframeVariant(selectedKeyframe) ?? '')
	let selectContainer: HTMLDivElement

	if (!Variant.all.find(v => v.uuid === KEYFRAME_VALUE.get())) {
		console.warn('Keyframe variant not found. Resetting to default.')
		const uuid = Variant.getDefault().uuid
		setKeyframeVariant(selectedKeyframe, uuid)
		KEYFRAME_VALUE.set(uuid)
	}

	KEYFRAME_VALUE.subscribe(value => {
		setKeyframeVariant(selectedKeyframe, value)
	})

	const OPTIONS = Object.fromEntries(
		Variant.all.map(variant => [variant.uuid, variant.displayName])
	)

	const SELECT_ELEMENT = new Interface.CustomElements.SelectInput('keyframe-variant-selector', {
		options: OPTIONS,
		value: KEYFRAME_VALUE.get(),
		onChange() {
			const value = SELECT_ELEMENT.node.getAttribute('value')
			if (value == undefined) {
				console.warn('Variant value is undefined')
				return
			}
			KEYFRAME_VALUE.set(value)
			Animator.preview()
		},
	})

	requestAnimationFrame(() => {
		selectContainer.appendChild(SELECT_ELEMENT.node)
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

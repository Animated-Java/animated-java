<script lang="ts">
	import {
		getKeyframeVariant,
		setKeyframeVariant,
	} from '../../../blockbench-mods/misc/customKeyframes'
	import { Syncable } from '../../../util/stores'
	import { translate } from '../../../util/translation'
	import { Variant } from '../../../variants'

	export let selectedKeyframe: _Keyframe
	const KEYFRAME_VALUE = new Syncable<string>(getKeyframeVariant(selectedKeyframe)!)
	let selectContainer: HTMLDivElement

	KEYFRAME_VALUE.subscribe(value => {
		setKeyframeVariant(selectedKeyframe, value)
	})

	const OPTIONS = Object.fromEntries(
		Variant.all.map(variant => [variant.uuid, variant.displayName])
	)

	const SELECT_INPUT = new Interface.CustomElements.SelectInput('keyframe-variant-selector', {
		options: OPTIONS,
		value: KEYFRAME_VALUE.get(),
		onChange() {
			KEYFRAME_VALUE.set(SELECT_INPUT.node.getAttribute('value')!)
			Animator.preview()
		},
	})

	requestAnimationFrame(() => {
		selectContainer.appendChild(SELECT_INPUT.node)
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

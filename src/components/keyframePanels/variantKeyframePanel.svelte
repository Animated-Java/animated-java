<script lang="ts" context="module">
	import { translate } from '../../util/translation'
	import { Variant } from '../../variants'
	import CustomCodeJar from '../customCodeJar.svelte'
</script>

<script lang="ts">
	export let keyframe: _Keyframe

	let variantUuid = keyframe?.variant?.uuid ?? Variant.getDefault().uuid
	let executeCondition = keyframe?.execute_condition ?? ''

	$: {
		keyframe.variant = Variant.getByUUID(variantUuid) ?? Variant.getDefault()
		keyframe.execute_condition = executeCondition
		Animator.preview()
	}

	const OPTIONS = Object.fromEntries(
		Variant.all.map(variant => [variant.uuid, variant.displayName])
	)

	const SELECT_ELEMENT = new Interface.CustomElements.SelectInput('keyframe-variant-selector', {
		options: OPTIONS,
		value: variantUuid,
		onChange() {
			const value = SELECT_ELEMENT.node.getAttribute('value')
			if (value == undefined) {
				console.warn('Variant value is undefined')
				return
			}
			variantUuid = value
		},
	})

	let selectContainer: HTMLDivElement
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

<div class="bar flex custom-bar">
	<label
		for="execute_condition"
		class="undefined"
		style="font-weight: unset;"
		title={translate('panel.keyframe.execute_condition.description')}
	>
		{translate('panel.keyframe.execute_condition.title')}
	</label>
	<CustomCodeJar bind:value={executeCondition} placeholder={'if score @s matches 1..'} />
</div>

<style>
	.custom-bar {
		flex-direction: column;
	}
	.select-container {
		flex-grow: 1;
		height: 30px;
		padding-left: 8px;
	}
</style>

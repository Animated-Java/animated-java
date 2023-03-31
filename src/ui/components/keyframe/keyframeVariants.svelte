<script lang="ts">
	import {
		getKeyframeCondition,
		getKeyframeVariant,
		setKeyframeCondition,
		setKeyframeVariant,
	} from '../../../mods/keyframeMod'
	import { translate } from '../../../util/translation'
	import { Variant } from '../../../variants'
	import PrismEditorComponent from '../prism/prismEditor.svelte'

	const maxWidth = 'auto'
	const maxHeight = '20em'

	let value: number
	let executeCondition: string

	$: variants = getVariants()
	let selectedVariant: Variant | undefined
	let selectedKeyframe: _Keyframe | undefined

	$: {
		selectedKeyframe = Blockbench.Keyframe.selected.at(0)
		if (value === undefined && selectedKeyframe) {
			// If the value is undefined the selected keyframe was just selected.
			// So we need to read the existing value from the keyframe.
			// console.log('value undefined')
			const variantStr = getKeyframeVariant(selectedKeyframe)
			if (variantStr) {
				const variant = variants.find(v => v.uuid === variantStr)
				if (variant) value = variants.indexOf(variant)
			}
			const conditionStr = getKeyframeCondition(selectedKeyframe)
			if (conditionStr) {
				executeCondition = conditionStr
			}
		}
		selectedVariant = variants.at(value)
		if (selectedKeyframe) {
			if (selectedVariant) {
				setKeyframeVariant(selectedKeyframe, selectedVariant.uuid)
				Animator.preview()
			}
			if (executeCondition !== undefined)
				setKeyframeCondition(selectedKeyframe, executeCondition)
		}
	}

	function getVariants() {
		return Project?.animated_java_variants?.variants || []
	}
</script>

<div class="property">
	<p class="name" title={translate('animated_java.keyframe.variant.description')}>
		{translate('animated_java.keyframe.variant')}
	</p>
	<select class="item-container item" bind:value>
		{#each variants as variant, index}
			<option value={index}>
				<div>{variant.name}</div>
			</option>
		{/each}
	</select>
</div>
<div class="property">
	<p class="name" title={translate('animated_java.keyframe.executeCondition.description')}>
		Condition
	</p>
	<div
		class="item-container"
		title={translate('animated_java.keyframe.executeCondition.description')}
	>
		<PrismEditorComponent language="mcfunction" bind:code={executeCondition} />
	</div>
</div>

<style>
	div.property {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		flex-grow: 1;
		margin-bottom: 2px;
	}

	p.name {
		padding: 3px 8px;
		margin: unset;
		background-color: var(--color-button);
	}

	.item-container {
		display: flex;
		flex-grow: 1;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		background-color: var(--color-back);
		font-family: var(--font-code);
		border: 1px solid var(--color-border);
	}

	.item {
		padding: 3px 8px;
	}
</style>

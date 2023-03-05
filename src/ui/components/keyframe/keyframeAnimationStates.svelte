<script lang="ts">
	import {
		getKeyframeAnimationState,
		getKeyframeCondition,
		setKeyframeAnimationState,
		setKeyframeCondition,
	} from '../../../mods/keyframeMod'
	import { translate } from '../../../util/translation'
	import { Variant } from '../../../variants'
	import PrismEditorComponent from '../prism/prismEditor.svelte'

	const maxWidth = 'auto'
	const maxHeight = '20em'

	let value: number
	let condition: string

	$: animations = getAnimations()
	let selectedAnimation: _Animation | undefined
	let selectedKeyframe: _Keyframe | undefined

	$: {
		selectedKeyframe = Blockbench.Keyframe.selected.at(0)
		if (value === undefined && selectedKeyframe) {
			// If the value is undefined the selected keyframe was just selected.
			// So we need to read the existing value from the keyframe.
			console.log('value undefined')
			const animUUID = getKeyframeAnimationState(selectedKeyframe)
			if (animUUID) {
				const anim = animations.find(v => v.uuid === animUUID)
				if (anim) value = animations.indexOf(anim)
			}
			const conditionStr = getKeyframeCondition(selectedKeyframe)
			if (conditionStr) {
				condition = conditionStr
			}
		}
		selectedAnimation = Blockbench.Animation.all.at(value) as _Animation
		if (selectedKeyframe) {
			if (selectedAnimation)
				setKeyframeAnimationState(selectedKeyframe, selectedAnimation.uuid)
			if (condition !== undefined) setKeyframeCondition(selectedKeyframe, condition)
		}
	}

	function getAnimations() {
		return (Blockbench.Animation.all || []) as _Animation[]
	}
</script>

<div class="property">
	<p class="name">{translate('animated_java.keyframe.animationState')}</p>
	<select class="item-container item" bind:value>
		{#each animations as anim, index}
			<option value={index}>
				<div>{anim.name}</div>
			</option>
		{/each}
	</select>
</div>
<div class="property">
	<p class="name" title={translate('animated_java.keyframe.condition.description')}>Condition</p>
	<div class="item-container" title={translate('animated_java.keyframe.condition.description')}>
		<PrismEditorComponent language="mcfunction" bind:code={condition} />
	</div>
</div>

<style>
	div.property {
		display: flex;
		flex-direction: row;
		flex-grow: 1;
		margin-bottom: 2px;
		align-items: stretch;
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

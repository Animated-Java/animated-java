<!-- <script lang="ts">
	import {
		getKeyframeAnimationState,
		getKeyframeCondition,
		setKeyframeAnimationState,
		setKeyframeCondition,
	} from '../../../mods/keyframeMod'
	import { translate } from '../../../util/translation'
	import PrismEditorComponent from '../prism/prismEditor.svelte'

	let value: number
	let executeCondition: string
	let tweenDuration: number
	let tweenMode: 'play' | 'resume'

	$: animations = getAnimations()
	let selectedAnimation: _Animation | undefined
	let selectedKeyframe: _Keyframe | undefined

	$: {
		selectedKeyframe = Blockbench.Keyframe.selected.at(0)
		if (value === undefined && selectedKeyframe) {
			// If the value is undefined the selected keyframe was just selected.
			// So we need to read the existing value from the keyframe.
			// console.log('value undefined')
			const animUUID = getKeyframeAnimationState(selectedKeyframe)
			if (animUUID) {
				const anim = animations.find(v => v.uuid === animUUID)
				if (anim) value = animations.indexOf(anim)
			}
			const conditionStr = getKeyframeCondition(selectedKeyframe)
			if (conditionStr) {
				executeCondition = conditionStr
			}
		}
		selectedAnimation = Blockbench.Animation.all.at(value) as _Animation
		if (selectedKeyframe) {
			if (selectedAnimation)
				setKeyframeAnimationState(selectedKeyframe, selectedAnimation.uuid)
			if (executeCondition !== undefined)
				setKeyframeCondition(selectedKeyframe, executeCondition)
		}
	}

	function getAnimations() {
		return (Blockbench.Animation.all || []) as _Animation[]
	}
</script>

<div class="property">
	<p class="name" title={translate('animated_java.keyframe.animation.description')}>
		{translate('animated_java.keyframe.animation')}
	</p>
	<div class="item-container">
		<select class="item" bind:value>
			{#each animations as anim, index}
				<option value={index}>
					<div>{anim.name}</div>
				</option>
			{/each}
		</select>
	</div>
</div>
<div class="property">
	<p class="name" title={translate('animated_java.keyframe.executeCondition.description')}>
		{translate('animated_java.keyframe.executeCondition')}
	</p>
	<div
		class="item-container"
		title={translate('animated_java.keyframe.executeCondition.description')}
	>
		<PrismEditorComponent language="mcfunction" bind:code={executeCondition} />
	</div>
</div>
<div class="property">
	<p class="name" title={translate('animated_java.keyframe.tweenDuration.description')}>
		{translate('animated_java.keyframe.tweenDuration')}
	</p>
	<div class="item-container">
		<input type="number" class="number" step={1} bind:value={tweenDuration} />
	</div>
</div>
<div class="property">
	<p class="name" title={translate('animated_java.keyframe.tweenMode.description')}>
		{translate('animated_java.keyframe.tweenMode')}
	</p>
	<div class="item-container">
		<select class="item" bind:value={tweenMode}>
			<option value="play">{translate('animated_java.keyframe.tweenMode.play')}</option>
			<option value="resume">{translate('animated_java.keyframe.tweenMode.resume')}</option>
		</select>
	</div>
</div>

<style>
	div.property {
		display: flex;
		flex-direction: row;
		flex-grow: 1;
		margin-bottom: 2px;
		align-items: stretch;
		min-height: 2em;
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

	.number {
		border: none;
		display: inline-block;
		text-align: center;
		vertical-align: middle;
		cursor: default;
		outline: none;
		height: 32px;
		width: 6em;
		color: var(--color-text);
		padding-right: 16px;
		padding-left: 16px;
		font-weight: normal;
		cursor: text;
		text-align: left;
	}
</style> -->

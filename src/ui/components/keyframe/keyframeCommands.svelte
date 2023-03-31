<script lang="ts">
	import {
		getKeyframeCommands,
		getKeyframeCondition,
		setKeyframeCommands,
		setKeyframeCondition,
	} from '../../../mods/keyframeMod'
	import { translate } from '../../../util/translation'
	import PrismEditorComponent from '../prism/prismEditor.svelte'

	let value: string
	let selectedKeyframe: _Keyframe | undefined
	let executeCondition: string

	$: {
		selectedKeyframe = Blockbench.Keyframe.selected.at(0)
		if (value === undefined && selectedKeyframe) {
			// If the value is undefined the selected keyframe was just selected.
			// So we need to read the existing value from the keyframe.
			// console.log('value undefined')
			const commandsStr = getKeyframeCommands(selectedKeyframe)
			if (commandsStr) {
				value = commandsStr
			}
			const conditionStr = getKeyframeCondition(selectedKeyframe)
			if (conditionStr) {
				executeCondition = conditionStr
			}
		}
		if (selectedKeyframe) {
			setKeyframeCommands(selectedKeyframe, value)
			if (executeCondition !== undefined)
				setKeyframeCondition(selectedKeyframe, executeCondition)
		}
	}
</script>

<div class="property">
	<p class="name" title={translate('animated_java.keyframe.commands.description')}>
		{translate('animated_java.keyframe.commands')}
	</p>
	<div class="item-container" title={translate('animated_java.keyframe.commands.description')}>
		<PrismEditorComponent language="mcfunction" bind:code={value} />
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

<style>
	p.name {
		padding: 3px 8px;
		margin: unset;
		background-color: var(--color-button);
	}

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
</style>

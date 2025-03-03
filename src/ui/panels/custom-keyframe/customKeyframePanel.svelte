<script lang="ts">
	import {
		getKeyframeExecuteCondition,
		setKeyframeExecuteCondition,
	} from '../../../blockbench-mods/misc/customKeyframes'
	import { Syncable } from '../../../util/stores'
	import { translate } from '../../../util/translation'
	import CommandsKeyframePanel from './commandsKeyframePanel.svelte'
	import VariantKeyframePanel from './variantKeyframePanel.svelte'

	export let selectedKeyframe: _Keyframe

	const EXECUTE_CONDITION = new Syncable<string>(
		getKeyframeExecuteCondition(selectedKeyframe) ?? ''
	)

	EXECUTE_CONDITION.subscribe(value => {
		setKeyframeExecuteCondition(selectedKeyframe, value)
	})
</script>

<div class="container">
	{#if selectedKeyframe.channel === 'variant'}
		<VariantKeyframePanel {selectedKeyframe} />
	{:else if selectedKeyframe.channel === 'commands'}
		<CommandsKeyframePanel {selectedKeyframe} />
	{:else}
		<p>Unknown keyframe channel: '{selectedKeyframe.channel}'</p>
	{/if}
	<div class="bar flex">
		<label
			for="execute_condition"
			class="undefined"
			style="font-weight: unset;"
			title={translate('panel.keyframe.execute_condition.description')}
		>
			{translate('panel.keyframe.execute_condition.title')}
		</label>
		<input
			id="execute_condition"
			type="text"
			class="dark_bordered code keyframe_input tab_target"
			bind:value={$EXECUTE_CONDITION}
		/>
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
	}
</style>

<script lang="ts" context="module">
	import {
		getKeyframeExecuteCondition,
		setKeyframeExecuteCondition,
	} from '../mods/customKeyframesMod'
	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'
	import CommandsKeyframePanel from './keyframePanels/commandsKeyframePanel.svelte'
	import VariantKeyframePanel from './keyframePanels/variantKeyframePanel.svelte'
</script>

<script lang="ts">
	export let selectedKeyframe: _Keyframe

	const executeCondition = new Valuable<string>(
		getKeyframeExecuteCondition(selectedKeyframe) || '',
	)

	executeCondition.subscribe(value => {
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
			bind:value={$executeCondition}
		/>
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
	}
</style>

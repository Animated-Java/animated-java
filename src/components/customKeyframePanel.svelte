<script lang="ts" context="module">
	import { Valuable } from '../util/stores'
</script>

<script lang="ts">
	import { translate } from '../util/translation'
	import CommandsKeyframePanel from './keyframePanels/commandsKeyframePanel.svelte'
	import VariantKeyframePanel from './keyframePanels/variantKeyframePanel.svelte'

	export let currentPanel: Valuable<HTMLDivElement>
	export let selectedKeyframe: _Keyframe

	const property = EffectAnimator.prototype.channels[selectedKeyframe.channel]
</script>

<div class="container" bind:this={$currentPanel}>
	<div class="bar flex">
		{#if selectedKeyframe.channel === 'variant'}
			<VariantKeyframePanel {selectedKeyframe} />
		{:else if selectedKeyframe.channel === 'commands'}
			<CommandsKeyframePanel {selectedKeyframe} />
		{:else}
			<p>Unknown keyframe channel: '{selectedKeyframe.channel}'</p>
		{/if}
	</div>
	<div class="bar flex">
		<label for="execute_condition" class="undefined" style="font-weight: unset;">
			{translate('effect_animator.keyframes.execute_condition')}
		</label>
		<input
			id="execute_condition"
			type="text"
			class="dark_bordered code keyframe_input tab_target"
		/>
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
	}
</style>

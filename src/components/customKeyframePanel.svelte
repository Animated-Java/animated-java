<script lang="ts" context="module">
	import { Valuable } from '../util/stores'
</script>

<script lang="ts">
	import { channel } from 'diagnostics_channel'
	import { translate } from '../util/translation'

	export let currentPanel: Valuable<HTMLDivElement>
	export let selectedKeyframe: _Keyframe

	const property = EffectAnimator.prototype.channels[selectedKeyframe.channel]
</script>

<div class="container" bind:this={$currentPanel}>
	<div class="bar flex">
		{#if selectedKeyframe.channel === 'variant'}
			<label for="variant_input" class="undefined" style="font-weight: unset;">
				{translate('effect_animator.timeline.variant')}
			</label>
			<input
				id="variant_input"
				type="text"
				class="dark_bordered code keyframe_input tab_target"
			/>
		{:else if selectedKeyframe.channel === 'commands'}
			<label for="commands_input" class="undefined" style="font-weight: unset;">
				{translate('effect_animator.timeline.commands')}
			</label>
			<input
				id="commands_input"
				type="text"
				class="dark_bordered code keyframe_input tab_target"
			/>
		{/if}
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
	}
</style>

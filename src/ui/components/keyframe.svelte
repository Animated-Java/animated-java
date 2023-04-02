<script lang="ts">
	import { onDestroy } from 'svelte'
	import KeyframeAnimationStates from './keyframe/keyframeAnimationStates.svelte'
	import KeyframeCommands from './keyframe/keyframeCommands.svelte'
	import KeyframeVariants from './keyframe/keyframeVariants.svelte'

	let selected: _Keyframe | undefined

	function getSelectedKeyframe() {
		return Blockbench.Keyframe.selected.at(0)
	}

	function updateKeyframeLabel() {
		const label = jQuery('#panel_keyframe .panel_vue_wrapper #keyframe_type_label label')
		const keyframeChannel = getSelectedKeyframe()?.channel
		if (label && keyframeChannel) {
			label.text(`Keyframe (${keyframeChannel[0].toUpperCase() + keyframeChannel.slice(1)})`)
		}
	}

	function onSelectionUpdate() {
		updateKeyframeLabel()
	}

	let destroyed = false
	function update() {
		if (destroyed) return
		if (selected !== Blockbench.Keyframe.selected[0]) {
			console.log('selected changed')
			onSelectionUpdate()
			selected = getSelectedKeyframe()
		}
		requestAnimationFrame(update)
	}

	update()

	onDestroy(() => {
		destroyed = true
	})
</script>

{#if selected}
	<div class="container">
		{#if selected.channel === 'variants'}
			{#key selected}
				<KeyframeVariants />
			{/key}
		{:else if selected.channel === 'commands'}
			{#key selected}
				<KeyframeCommands />
			{/key}
		{:else if selected.channel === 'animationStates'}
			{#key selected}
				<KeyframeAnimationStates />
			{/key}
		{/if}
	</div>
{/if}

<style>
	div.container {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}
</style>

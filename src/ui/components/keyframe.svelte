<script lang="ts">
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

	function update() {
		if (selected !== Blockbench.Keyframe.selected[0]) {
			console.log('selected changed')
			onSelectionUpdate()
			selected = getSelectedKeyframe()
		}
		requestAnimationFrame(update)
	}

	update()
</script>

{#if selected}
	<div class="container">
		{#if selected.channel === 'variants'}
			{#key selected}
				<KeyframeVariants />
			{/key}
		{:else if selected.channel === 'commands'}
			<KeyframeCommands />
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

	/* div.item {
		display: flex;
		flex-grow: 1;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		background-color: var(--color-back);
		font-family: var(--font-code);
		padding: 3px 8px;
		border: 1px solid var(--color-border);
	} */

	/* button {
		all: unset !important;

		display: flex !important;
		justify-content: center !important;
		align-content: center !important;
		flex-wrap: wrap !important;
	}

	button:hover {
		color: var(--color-light) !important;
	} */
</style>

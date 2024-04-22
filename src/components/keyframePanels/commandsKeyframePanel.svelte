<script lang="ts" context="module">
	import { Valuable } from '../../util/stores'
	import { getKeyframeCommands, setKeyframeCommands } from '../../mods/customKeyframesMod'
	import { translate } from '../../util/translation'
</script>

<script lang="ts">
	export let selectedKeyframe: _Keyframe

	const keyframeValue = new Valuable<string>(getKeyframeCommands(selectedKeyframe) || '')

	keyframeValue.subscribe(value => {
		setKeyframeCommands(selectedKeyframe, value)
	})
</script>

<label for="commands_input" class="undefined" style="font-weight: unset;">
	{translate('effect_animator.keyframes.commands')}
</label>
<!-- <ol>
	{#each $keyframeValue.split('\n') as line, index}
		<li>{index}</li>
	{/each}
</ol> -->
<textarea
	id="commands_input"
	class="dark_bordered code keyframe_input tab_target"
	bind:value={$keyframeValue}
/>

<style>
	textarea {
		min-height: 90px;
		height: 30px;
		resize: vertical;
		/* border: unset; */
	}
	/* ol {
		font-family: var(--font-code);
		width: 1.5rem;
		text-align: center;
	}
	ol li:nth-child(even) {
		background-color: var(--color-back);
	}
	li {
		list-style-type: none;
	} */
</style>

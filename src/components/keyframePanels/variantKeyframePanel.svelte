<script lang="ts" context="module">
	import { Valuable } from '../../util/stores'
	import { translate } from '../../util/translation'
	import { Variant } from '../../variants'
	import { getKeyframeVariant, setKeyframeVariant } from '../../mods/customKeyframesMod'
</script>

<script lang="ts">
	export let selectedKeyframe: _Keyframe
	const keyframeValue = new Valuable<string>(getKeyframeVariant(selectedKeyframe) as string)

	keyframeValue.subscribe(value => {
		setKeyframeVariant(selectedKeyframe, value)
	})
</script>

<label for="variant_input" class="undefined" style="font-weight: unset;">
	{translate('effect_animator.keyframes.variant')}
</label>

<select bind:value={$keyframeValue}>
	{#each Variant.all as variant}
		<option value={variant.uuid}>{variant.displayName}</option>
	{/each}
</select>

<style>
	select {
		flex-grow: 1;
		margin-left: 8px;
	}
</style>

<script lang="ts" context="module">
	import { translate } from '../../util/translation'
	import CustomCodeJar from '../customCodeJar.svelte'
</script>

<script lang="ts">
	export let keyframe: _Keyframe

	let func = keyframe?.function ?? ''
	let executeCondition = keyframe?.execute_condition ?? ''
	let repeat = keyframe?.repeat ?? false
	let repeatFrequency = keyframe?.repeat_frequency ?? 1

	$: {
		keyframe.function = func
		keyframe.execute_condition = executeCondition
		keyframe.repeat = repeat
		keyframe.repeat_frequency = repeatFrequency
	}
</script>

<div class="bar flex custom-bar">
	<label
		for="commands_input"
		class="undefined"
		style="font-weight: unset;"
		title={translate('panel.keyframe.function.description')}
	>
		{translate('panel.keyframe.function.title')}
	</label>
	<CustomCodeJar bind:value={func} placeholder={'say Hello, World!'} />
</div>

<div class="bar flex custom-bar">
	<label
		for="execute_condition"
		class="undefined"
		style="font-weight: unset;"
		title={translate('panel.keyframe.execute_condition.description')}
	>
		{translate('panel.keyframe.execute_condition.title')}
	</label>
	<CustomCodeJar bind:value={executeCondition} placeholder={'if score @s matches 1..'} />
</div>

<div class="bar flex">
	<label
		for="repeat_input"
		class="undefined"
		style="font-weight: unset;"
		title={translate('animated_java.panel.keyframe.repeat.description')}
	>
		{translate('panel.keyframe.repeat.title')}
	</label>
	<input
		id="repeat_input"
		class="dark_bordered tab_target"
		type="checkbox"
		bind:checked={repeat}
	/>
</div>

{#if keyframe?.repeat}
	<div class="bar flex">
		<label
			for="repeat_frequency_input"
			class="undefined"
			style="font-weight: unset;"
			title={translate('animated_java.panel.keyframe.repeat_frequency.description')}
		>
			{translate('panel.keyframe.repeat_frequency.title')}
		</label>
		<input
			id="repeat_frequency_input"
			class="dark_bordered tab_target"
			type="number"
			bind:value={repeatFrequency}
		/>
	</div>
{/if}

<style>
	.custom-bar {
		flex-direction: column;
	}
	input[type='checkbox'] {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		padding-left: 8px;
	}
</style>

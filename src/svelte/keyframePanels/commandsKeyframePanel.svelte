<script lang="ts" context="module">
	import { Valuable } from '../../util/stores'
	import {
		getKeyframeCommands,
		getKeyframeRepeat,
		getKeyframeRepeatFrequency,
		setKeyframeCommands,
		setKeyframeRepeat,
		setKeyframeRepeatFrequency,
	} from '../../mods/customKeyframesMod'
	import { translate } from '../../util/translation'
</script>

<script lang="ts">
	export let selectedKeyframe: _Keyframe

	const commands = new Valuable<string>(getKeyframeCommands(selectedKeyframe) || '')
	const repeat = new Valuable<boolean>(getKeyframeRepeat(selectedKeyframe) || false)
	const repeatFrequency = new Valuable<number>(getKeyframeRepeatFrequency(selectedKeyframe) || 1)

	commands.subscribe(value => {
		setKeyframeCommands(selectedKeyframe, value)
	})
	repeat.subscribe(value => {
		setKeyframeRepeat(selectedKeyframe, value)
	})
	repeatFrequency.subscribe(value => {
		if (value < 1) value = 1
		repeatFrequency.set(value)
		setKeyframeRepeatFrequency(selectedKeyframe, value)
	})
</script>

<div class="bar flex">
	<label
		for="commands_input"
		class="undefined"
		style="font-weight: unset;"
		title={translate('panel.keyframe.commands.description')}
	>
		{translate('panel.keyframe.commands.title')}
	</label>
	<textarea
		id="commands_input"
		class="dark_bordered code keyframe_input tab_target"
		bind:value={$commands}
	/>
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
		bind:checked={$repeat}
	/>
</div>

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
		bind:value={$repeatFrequency}
	/>
</div>

<style>
	textarea {
		min-height: 90px;
		height: 30px;
		resize: vertical;
		text-wrap: nowrap;
	}
	input[type='checkbox'] {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		padding-left: 8px;
	}
</style>

<script lang="ts" module>
	import { onDestroy, onMount } from 'svelte'
	import CustomCodeJar from '../../svelteComponents/customCodeJar.svelte'
	import { localize as translate } from '../../util/lang'
	import { getKeyframeRepeatSchedule, TICK_RATE } from '../../systems/repeatSchedule'
	import { editKeyframe, keyframeTextEdit } from './keyframeEdit'

	const SCHEDULE_EVENTS = ['finish_edit', 'undo', 'redo'] as const

	/** Formats a tick the way the timeline labels time: frame numbers or seconds. */
	function formatTimelineTime(tick: number) {
		const time = tick / TICK_RATE
		if (settings.timecode_frame_number.value)
			return String(Math.round(time / Timeline.getStep()))
		return String(Math.round(time * 100) / 100)
	}
</script>

<script lang="ts">
	export let keyframe: _Keyframe

	let func = keyframe?.function ?? ''
	let executeCondition = keyframe?.execute_condition ?? ''
	let repeat = keyframe?.repeat ?? false
	let repeatFrequency = keyframe?.repeat_frequency ?? 1
	// Empty instead of 0, so the input shows its "until next keyframe" placeholder.
	let repeatDuration: number | null =
		(keyframe?.repeat_duration ?? 0) > 0 ? keyframe.repeat_duration! : null
	let schedule = getKeyframeRepeatSchedule(keyframe)

	$: {
		keyframe.function = func
		keyframe.execute_condition = executeCondition
		keyframe.repeat_frequency = repeatFrequency
		keyframe.repeat_duration = Math.max(0, Math.round(Number(repeatDuration) || 0))
		refreshSchedule()
	}

	function refreshSchedule() {
		schedule = getKeyframeRepeatSchedule(keyframe)
	}

	// Moving this keyframe or its neighbors, or changing the animation's length, moves its runs.
	onMount(() => {
		for (const event of SCHEDULE_EVENTS) Blockbench.on(event, refreshSchedule)
	})
	onDestroy(() => {
		for (const event of SCHEDULE_EVENTS) Blockbench.removeListener(event, refreshSchedule)
	})

	function setRepeat(event: Event) {
		repeat = (event.currentTarget as HTMLInputElement).checked
		editKeyframe(keyframe, () => (keyframe.repeat = repeat))
		refreshSchedule()
	}
</script>

<div class="bar flex custom-bar" use:keyframeTextEdit={keyframe}>
	<label
		for="commands_input"
		class="undefined"
		style="font-weight: unset;"
		title={translate('panel.keyframe.function.description')}
	>
		{translate('panel.keyframe.function.title')}
	</label>
	<CustomCodeJar bind:value={func} placeholder={'say Hello, World!'} syntax="mcfunction" />
</div>

<div class="bar flex custom-bar" use:keyframeTextEdit={keyframe}>
	<label
		for="execute_condition"
		class="undefined"
		style="font-weight: unset;"
		title={translate('panel.keyframe.execute_condition.description')}
	>
		{translate('panel.keyframe.execute_condition.title')}
	</label>
	<CustomCodeJar
		bind:value={executeCondition}
		placeholder={'if score @s matches 1..'}
		syntax="mcfunction"
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
		checked={repeat}
		on:change={setRepeat}
	/>
</div>

{#if repeat}
	<div class="bar flex" use:keyframeTextEdit={keyframe}>
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

	<div class="bar flex" use:keyframeTextEdit={keyframe}>
		<label
			for="repeat_duration_input"
			class="undefined"
			style="font-weight: unset;"
			title={translate('animated_java.panel.keyframe.repeat_duration.description')}
		>
			{translate('panel.keyframe.repeat_duration.title')}
		</label>
		<input
			id="repeat_duration_input"
			class="dark_bordered tab_target"
			type="number"
			min="0"
			step="1"
			placeholder={translate('panel.keyframe.repeat_duration.placeholder')}
			bind:value={repeatDuration}
		/>
	</div>

	<div class="repeat_info">
		<span id="repeat_runs">
			{schedule.ticks.length === 1
				? translate('panel.keyframe.repeat_runs.one')
				: translate('panel.keyframe.repeat_runs.many', String(schedule.ticks.length))}
		</span>
		{#if schedule.cutoff !== undefined}
			<span class="repeat_warning" id="repeat_cutoff_warning">
				<i class="material-icons">warning</i>
				{translate('panel.keyframe.repeat_cutoff', formatTimelineTime(schedule.cutoff))}
			</span>
		{/if}
		{#if schedule.overrun}
			<span class="repeat_warning" id="repeat_overrun_warning">
				<i class="material-icons">info</i>
				{translate(
					'panel.keyframe.repeat_overrun',
					formatTimelineTime(schedule.plannedUntil)
				)}
			</span>
		{/if}
	</div>
{/if}

<style>
	.repeat_info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 2px 8px;
		color: var(--color-subtle_text);
	}
	.repeat_warning {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	#repeat_cutoff_warning {
		color: var(--color-warning);
	}
	.repeat_warning i {
		font-size: 16px;
	}
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

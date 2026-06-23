<script lang="ts" module>
	import { onDestroy, onMount } from 'svelte'
	import { getEasingArgDefault, hasArgs } from '../../util/easing'
	// @ts-expect-error No types for glob imports
	import { default as ICON_IMPORTS, filenames } from '../../assets/easingIcons/*.svg'

	import { createScopedTranslator } from '../../util/lang'

	const localize = createScopedTranslator('panel.easings')

	const ICONS = Object.fromEntries(
		(ICON_IMPORTS as unknown as Array<{ default: string }>).map((icon, i) => [
			PathModule.basename(filenames[i]).replace('.svg', '').toLowerCase(),
			icon.default,
		])
	)

	const EASING_MODE_ICONS: Record<string, string> = {
		in: ICONS.expo,
		out: ICONS.out,
		inout: ICONS.inout,
	}

	const EASING_TYPES = [
		'linear',
		'sine',
		'quad',
		'cubic',
		'quart',
		'quint',
		'expo',
		'circ',
		'elastic',
		'back',
		'bounce',
	]

	const EASING_MODES = ['in', 'out', 'inout']

	function isFirstKeyframe(kf: _Keyframe) {
		return (
			kf.animator.keyframes
				.filter(k => k.channel === kf.channel)
				.sort((a, b) => a.time - b.time)[0] === kf
		)
	}

	function getKeyframeEasing(kf: _Keyframe): { type: string; mode?: string; arg?: number } {
		if (!kf.easing) return { type: 'linear' }
		const match = /ease(InOut|Out|In)?(.+)/.exec(kf.easing)
		if (!match) return { type: kf.easing }

		const type = match[2].toLowerCase()
		const mode = match[1]?.toLowerCase() ?? 'inout'

		if (hasArgs(kf.easing)) {
			return {
				type,
				mode,
				arg: kf.easingArgs?.at(0) ?? getEasingArgDefault(kf.easing),
			}
		}
		return { type, mode }
	}

	function setKeyframeEasing(kf: _Keyframe, type: string, mode = 'inout') {
		if (type === 'linear') {
			kf.easing = 'linear'
		} else {
			const name = getEasingFunctionName(type, mode)
			if (kf.easing !== name) {
				Project.saved = false
			}
			kf.easing = name
		}
	}

	function setKeyframeEasingArg(kf: _Keyframe, arg: number | undefined) {
		if (arg == undefined || isNaN(arg)) {
			delete kf.easingArgs
		} else {
			if (kf.easingArgs?.at(0) !== arg) {
				Project.saved = false
			}
			kf.easingArgs = [arg]
		}
	}

	function getEasingFunctionName(type: string, mode = 'inout') {
		if (type === 'linear') return 'linear'
		return `ease${
			mode && mode !== 'inout' ? mode[0].toUpperCase() + mode.slice(1) : 'InOut'
		}${type[0].toUpperCase() + type.slice(1)}`
	}
</script>

<script lang="ts">
	let selectedKeyframe = $state<_Keyframe | undefined>()
	let easingType = $state('linear')
	let easingMode: string | undefined = $state()
	let easingArg: number | undefined = $state()
	let easingFunction = $derived(getEasingFunctionName(easingType, easingMode))

	const onKeyframeSelectionUpdate = () => {
		selectedKeyframe = Timeline.selected.at(0)
		if (!selectedKeyframe) {
			easingType = 'linear'
			easingMode = undefined
			easingArg = undefined
			return
		}
		const { type, mode, arg } = getKeyframeEasing(selectedKeyframe)
		easingType = type
		easingMode = mode
		easingArg = arg ?? getEasingArgDefault(getEasingFunctionName(type, mode))
	}

	onMount(() => {
		Blockbench.on('update_keyframe_selection', onKeyframeSelectionUpdate)
	})

	onDestroy(() => {
		Blockbench.removeListener('update_keyframe_selection', onKeyframeSelectionUpdate)
	})

	function makeChange() {
		console.log('Changing easing to', easingType, easingMode, easingArg)
		Undo.initEdit({ keyframes: [...Timeline.selected] })
		for (const kf of Timeline.selected) {
			setKeyframeEasing(kf, easingType, easingMode)
			setKeyframeEasingArg(kf, easingArg)
		}
		Undo.finishEdit('Change keyframe easing', { keyframes: [...Timeline.selected] })

		Animator.preview()
	}
</script>

{#key selectedKeyframe}
	{#if selectedKeyframe === undefined}
		<div class="message">
			{@html localize('no_keyframe_selected')}
		</div>
	{:else if isFirstKeyframe(selectedKeyframe)}
		<div class="message">
			{@html localize('first_keyframe_easing')}
		</div>
	{:else if selectedKeyframe?.interpolation === 'linear'}
		<div class="bar flex bar-flex-fix">
			<label
				for="easing_type_input"
				class="undefined"
				style="font-weight: unset; width: 100px; text-align: left;"
				title={localize('easing_type.description')}
			>
				{localize('easing_type.title')}
			</label>
			{#key easingType}
				<div id="easing_type_input" class="easing-container">
					{#each EASING_TYPES as ease}
						<button
							class="easing-type"
							title={localize(`easing_type.options.${ease}`)}
							onclick={() => {
								easingType = ease
								easingArg = getEasingArgDefault(
									getEasingFunctionName(easingType, easingMode)
								)
								makeChange()
							}}
						>
							<img
								class={easingType === ease ? 'selected-keyframe-icon' : ''}
								src={ICONS[ease]}
								alt={ease}
							/>
						</button>
					{/each}
				</div>
			{/key}
		</div>
		{#if selectedKeyframe.easing !== 'linear'}
			<div class="bar flex bar-flex-fix">
				<label
					for="easing_mode_input"
					class="undefined"
					style="font-weight: unset; width: 100px; text-align: left;"
					title={localize('easing_mode.description')}
				>
					{localize('easing_mode.title')}
				</label>
				{#key easingFunction}
					<div id="easing_mode_input" class="easing-container">
						{#each EASING_MODES as mode}
							<button
								class="easing-type"
								title={localize(`easing_mode.options.${mode}`)}
								onclick={() => {
									easingMode = mode
									makeChange()
								}}
							>
								<img
									class={easingMode === mode ? 'selected-keyframe-icon' : ''}
									src={EASING_MODE_ICONS[mode]}
									alt={mode}
								/>
							</button>
						{/each}
					</div>
				{/key}
			</div>
		{/if}
		{#if hasArgs(easingFunction)}
			<div class="bar flex bar-flex-fix">
				<label
					for="easing_arg_input"
					class="undefined"
					style="font-weight: unset; width: 100px; text-align: left;"
					title={localize(`easing_args.easing_arg.${easingType}.description`)}
				>
					{localize(`easing_args.easing_arg.${easingType}.title`)}
				</label>
				<input
					id="easing_arg_input"
					class="dark_bordered tab_target"
					style="width: 66px; margin-left: 2px;"
					type="number"
					step="0.1"
					min="0"
					bind:value={easingArg}
					oninput={makeChange}
				/>
			</div>
		{/if}
	{:else}
		<div class="message">
			{@html localize('nonlinear_interpolation')}
		</div>
	{/if}
{/key}

<style>
	.message {
		margin-left: 16px;
		font-size: 16px;
		color: var(--color-subtle_text);
		text-wrap: balance;
		margin-bottom: 1rem;
		font-style: italic;
	}

	.easing-container {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		grid-gap: 2px;
		margin-left: 2px;
	}

	.easing-type {
		width: 32px;
		padding: 0px;
		margin: 0px;
		min-width: unset;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.easing-type:hover {
		background-color: var(--color-selected);
	}

	.selected-keyframe-icon {
		filter: invert(49%) sepia(16%) saturate(6320%) hue-rotate(198deg) brightness(101%)
			contrast(106%);
	}

	label {
		background-color: var(--color-elevated);
		padding-left: 8px;
		align-content: center;
	}

	.bar-flex-fix {
		display: flex;
		margin-top: 2px;
		min-height: 32px;
	}
</style>

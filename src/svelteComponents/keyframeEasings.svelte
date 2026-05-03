<script lang="ts" module>
	import { onMount } from 'svelte'
	// @ts-expect-error No types for glob imports
	import { default as ICON_IMPORTS, filenames } from '../assets/easingIcons/*.svg'
	import { getEasingArgDefault, hasArgs } from '../util/easing'
	import { localize as translate } from '../util/lang'

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
			kf.easing = getEasingFunctionName(type, mode)
		}
		Project.saved = false
	}

	function setKeyframeEasingArg(kf: _Keyframe, arg: number | undefined) {
		if (arg == undefined || isNaN(arg)) {
			delete kf.easingArgs
		} else {
			kf.easingArgs = [arg]
		}
		Project.saved = false
	}

	function getEasingFunctionName(type: string, mode = 'inout') {
		if (type === 'linear') return 'linear'
		return `ease${
			mode && mode !== 'inout' ? mode[0].toUpperCase() + mode.slice(1) : 'InOut'
		}${type[0].toUpperCase() + type.slice(1)}`
	}
</script>

<script lang="ts">
	interface Props {
		selectedKeyframe: _Keyframe
	}

	let { selectedKeyframe }: Props = $props()

	let easingType = $state('linear')
	let easingMode: string | undefined = $state()
	let easingArg: number | undefined = $state()
	let easingFunction = $derived(getEasingFunctionName(easingType, easingMode))

	onMount(() => {
		const { type, mode, arg } = getKeyframeEasing(selectedKeyframe)
		easingType = type
		easingMode = mode
		easingArg = arg
	})

	$effect(() => {
		setKeyframeEasing(selectedKeyframe, easingType, easingMode)
		setKeyframeEasingArg(selectedKeyframe, easingArg)
		Animator.preview()
	})
</script>

{#if selectedKeyframe?.interpolation === 'linear'}
	<div class="bar flex">
		<label
			for="easing_type_input"
			class="undefined"
			style="font-weight: unset; width: 100px; text-align: left;"
			title={translate('panel.keyframe.easing_type.description')}
		>
			{translate('panel.keyframe.easing_type.title')}
		</label>
		{#key easingType}
			<div id="easing_type_input" class="easing-container">
				{#each EASING_TYPES as ease}
					<button
						class="easing-type"
						title={translate(`panel.keyframe.easing_type.options.${ease}`)}
						onclick={() => (easingType = ease)}
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
		<div class="bar flex">
			<label
				for="easing_mode_input"
				class="undefined"
				style="font-weight: unset; width: 100px; text-align: left;"
				title={translate('panel.keyframe.easing_mode.description')}
			>
				{translate('panel.keyframe.easing_mode.title')}
			</label>
			{#key easingFunction}
				<div id="easing_mode_input" class="easing-container">
					{#each EASING_MODES as mode}
						<button
							class="easing-type"
							title={translate(`panel.keyframe.easing_mode.options.${mode}`)}
							onclick={() => (easingMode = mode)}
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
		<div class="bar flex">
			<label
				for="easing_arg_input"
				class="undefined"
				style="font-weight: unset; width: 100px; text-align: left;"
				title={translate(`panel.keyframe.easing_args.easing_arg.${easingType}.description`)}
			>
				{translate(`panel.keyframe.easing_args.easing_arg.${easingType}.title`)}
			</label>
			<input
				id="easing_arg_input"
				class="dark_bordered tab_target"
				style="width: 66px; margin-left: 2px;"
				type="number"
				step="0.1"
				min="0"
				bind:value={easingArg}
			/>
		</div>
	{/if}
{:else}
	<div class="easings-disabled">
		{translate('panel.keyframe.nonlinear_interpolation')}
	</div>
{/if}

<style>
	.easings-disabled {
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
</style>

<script lang="ts" context="module">
	import { activeProjectIsBlueprintFormat } from 'src/formats/blueprint'
	// @ts-expect-error No types for glob imports
	import { default as ICON_IMPORTS, filenames } from '../assets/easingIcons/*.svg'
	import { getEasingArgDefault, hasArgs } from '../util/easing'
	import EVENTS from '../util/events'
	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'

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
</script>

<script lang="ts">
	let easingType = 'linear'
	let easingMode: string | undefined
	let easingArg: Valuable<number> | undefined

	function getSelectedEasing() {
		if (!selectedKeyframe?.easing) return
		const match = /ease(InOut|Out|In)(.+)/.exec(selectedKeyframe.easing)
		if (!match) {
			return {
				type: selectedKeyframe.easing,
			}
		}

		if (hasArgs(selectedKeyframe.easing)) getEasingArgs()

		return {
			type: match?.[2].toLowerCase(),
			mode: match?.[1].toLowerCase(),
		}
	}

	function setSelectedEasing(type: string, mode = 'inout') {
		if (!selectedKeyframe) return
		if (type === 'linear') {
			selectedKeyframe.easing = 'linear'
		} else {
			selectedKeyframe.easing = `ease${
				mode && mode !== 'inout' ? mode[0].toUpperCase() + mode.slice(1) : 'InOut'
			}${type[0].toUpperCase() + type.slice(1)}`
		}
		if (easingType !== type) {
			getEasingArgs()
		}
		easingType = type
		easingMode = mode
	}

	let unsub: (() => void) | undefined
	function getEasingArgs() {
		unsub?.()
		if (!selectedKeyframe) return
		if (hasArgs(selectedKeyframe.easing)) {
			easingArg = new Valuable(
				selectedKeyframe.easingArgs?.[0] ?? getEasingArgDefault(selectedKeyframe) ?? 0
			)
			unsub = easingArg?.subscribe(value => setEasingArgs(value))
		} else {
			easingArg = undefined
		}
	}

	function setEasingArgs(arg: number | undefined) {
		if (!selectedKeyframe) return
		if (!arg) {
			delete selectedKeyframe.easingArgs
			return
		}
		selectedKeyframe.easingArgs = [arg]
	}

	let selectedKeyframe: _Keyframe | undefined

	function isFirstKeyframe(kf: _Keyframe) {
		return (
			kf.animator.keyframes
				.filter(k => k.channel === kf.channel)
				.sort((a, b) => a.time - b.time)[0] === kf
		)
	}

	EVENTS.UPDATE_KEYFRAME_SELECTION.subscribe(() => {
		const selected = Timeline.selected.at(0)
		if (
			activeProjectIsBlueprintFormat() &&
			selected &&
			['position', 'rotation', 'scale'].includes(selected.channel) &&
			!isFirstKeyframe(selected)
		) {
			selectedKeyframe = selected
			const easing = getSelectedEasing()
			if (easing) {
				easingType = easing.type
				easingMode = easing.mode
			}
		} else {
			setEasingArgs($easingArg)
			selectedKeyframe = undefined
		}
	})

	EVENTS.UNSELECT_AJ_PROJECT.subscribe(() => {
		setEasingArgs($easingArg)
		selectedKeyframe = undefined
	})
</script>

{#if selectedKeyframe}
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
							on:click={() => setSelectedEasing(ease, easingMode)}
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
				{#key easingMode}
					<div id="easing_mode_input" class="easing-container">
						{#each EASING_MODES as mode}
							<button
								class="easing-type"
								title={translate(`panel.keyframe.easing_mode.options.${mode}`)}
								on:click={() => setSelectedEasing(easingType, mode)}
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
		{#if hasArgs(selectedKeyframe?.easing)}
			<div class="bar flex">
				<label
					for="easing_arg_input"
					class="undefined"
					style="font-weight: unset; width: 100px; text-align: left;"
					title={translate(
						`panel.keyframe.easing_args.easing_arg.${easingType}.description`
					)}
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
					bind:value={$easingArg}
				/>
			</div>
		{/if}
	{:else}
		<div class="easings-disabled">
			{translate('panel.keyframe.nonlinear_interpolation')}
		</div>
	{/if}
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

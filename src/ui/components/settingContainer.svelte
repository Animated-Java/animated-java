<script lang="ts">
	import { onDestroy } from 'svelte'
	import type * as AJ from '../../settings'
	import { debounce } from '../../util/misc'
	import { fade, slide } from '../util/accessability'
	import IconButton from './buttons/iconButton.svelte'
	import SettingInfoPopup from './settingInfoPopup.svelte'

	export let setting: AJ.Setting<any>

	let descriptionVisible = false
	let helpButtonHovered = false
	let descriptionState: 'introstart' | 'introend' | 'outrostart' | 'outroend' | 'none' = 'none'
	let infoPopup: AJ.IInfoPopup | undefined = undefined

	function updateInfoPopup() {
		infoPopup = setting.infoPopup
	}

	setting._onUpdate(true)
	updateInfoPopup()

	const unsub = setting.subscribe(
		debounce(() => {
			updateInfoPopup()
		}, 250),
	)

	onDestroy(() => {
		unsub()
	})

	function onHelpButtonHovered(hovered: boolean) {
		helpButtonHovered = hovered
		if (descriptionState === 'outrostart') return
		descriptionVisible = hovered
	}

	function onDescriptionTransition(state: typeof descriptionState) {
		// console.log(`Description transition ${state}`)
		descriptionState = state
		descriptionVisible = helpButtonHovered
	}

	function onResetClick() {
		console.log(`Resetting setting '${setting.displayName}' to default value`)
		setting.value = setting.defaultValue
		setting._onUpdate(true)
	}

	function onHelpButtonClick() {
		// console.log(`Help button clicked for setting '${setting.displayName}' ${setting.docsLink}`)
		AnimatedJava.docClick(setting.docsLink || 'page:meta/undocumented')
	}
</script>

<div class="setting flex-column" style="align-items:stretch;">
	<div class="flex-row" style="justify-content:space-between;">
		<div class="flex">
			<p class="setting-name">{setting.displayName}</p>
		</div>
		<div class="flex" style="justify-content:flex-end; flex-grow:1; padding-left:10px;">
			<slot name="inline" />
		</div>

		{#if setting.resettable}
			<IconButton onClick={onResetClick} icon="delete" />
		{/if}

		<IconButton
			onClick={onHelpButtonClick}
			onHoverChange={onHelpButtonHovered}
			icon="question_mark"
		/>
	</div>

	<slot name="beneath" />

	{#if setting.subtext}
		<div class="subtext">{setting.subtext}</div>
	{:else}
		<div class="spacer" />
	{/if}

	{#if descriptionVisible}
		<div
			class="setting-description flex-column"
			in:$slide={{ delay: 100, duration: 150 }}
			out:$slide={{ duration: 150 }}
			on:introstart={() => onDescriptionTransition('introstart')}
			on:introend={() => onDescriptionTransition('introend')}
			on:outrostart={() => onDescriptionTransition('outrostart')}
			on:outroend={() => onDescriptionTransition('outroend')}
		>
			{#each setting.description as line, index}
				<p class="setting-description" in:$fade={{ delay: 150, duration: 150 }}>
					{line}
				</p>
			{/each}
		</div>
	{/if}

	{#if infoPopup}
		<div transition:$slide|local={{ delay: 500, duration: 200 }}>
			<SettingInfoPopup type={infoPopup.type} popup={infoPopup} />
		</div>
	{/if}
</div>

<style>
	p {
		display: inline-block;
	}

	p.setting-name {
		min-width: 150px;
		width: fit-content;
	}

	div.spacer {
		min-height: 10px;
	}

	div.setting-description {
		pointer-events: none;
		background: var(--color-dark);
		padding-left: 5px;
		padding-right: 5px;
		padding-bottom: 5px;
		margin-bottom: 10px;
		overflow: hidden;
	}

	p.setting-description {
		margin: 5px;
		margin-bottom: 0px;
	}

	div.subtext {
		font-style: italic;
		font-size: 0.8em;
		color: var(--color-subtle_text);
		text-align: center;
		margin-top: 1px;
		margin-bottom: 1px;
		cursor: text;
		user-select: text;
	}

	div.setting {
		display: flex;
		align-items: center;
		padding: 10px;
		padding-bottom: 0px;
		position: relative;
		justify-content: space-between;
		border-bottom: 1px solid var(--color-border);
		background-color: var(--color-back);
		border-bottom: 4px solid var(--color-border);
		margin-bottom: 10px;
	}

	div.flex {
		display: flex;
		align-items: center;
	}

	div.flex-column {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	div.flex-row {
		display: flex;
		align-items: center;
		flex-direction: row;
	}
</style>

<script lang="ts">
	import * as AJ from '../../settings'
	import SettingInfoPopup from './settingInfoPopup.svelte'
	import { fly, slide } from 'svelte/transition'
	import Checkbox from './settingDisplays/checkbox.svelte'
	import Number from './settingDisplays/number.svelte'
	import TextInline from './settingDisplays/textInline.svelte'
	import Dropdown from './settingDisplays/dropdown.svelte'
	import Folder from './settingDisplays/folder.svelte'
	import File from './settingDisplays/file.svelte'
	import ImageDropdown from './settingDisplays/imageDropdown.svelte'
	import IconButton from './buttons/iconButton.svelte'
	import Codebox from './settingDisplays/codebox.svelte'

	export let setting: AJ.Setting<any>

	let descriptionVisible = false
	let helpButtonHovered = false
	let descriptionState: 'introstart' | 'introend' | 'outrostart' | 'outroend' | 'none' = 'none'

	setting._onInit()

	$: {
		setting._onUpdate()
	}

	function onHelpButtonHovered(hovered: boolean) {
		helpButtonHovered = hovered
		if (descriptionState === 'outrostart') return
		descriptionVisible = hovered
	}

	function onDescriptionTransition(state: typeof descriptionState) {
		console.log(`Description transition ${state}`)
		descriptionState = state
		descriptionVisible = helpButtonHovered
	}

	function onResetClick() {
		console.log(`Setting '${setting.displayName}' reset!`)
		setting.value = setting.defaultValue
	}

	function onHelpButtonClick() {
		console.log(`Help button clicked for setting '${setting.displayName}' ${setting.docsLink}`)
		AnimatedJava.docClick(setting.docsLink || 'page:meta/undocumented')
	}
</script>

<div class="setting flex-column" style="align-items:stretch;">
	<div class="flex-row" style="justify-content:space-between;">
		<div class="flex">
			<p class="setting-name">{setting.displayName}</p>
		</div>
		<div class="flex" style="justify-content:flex-end; flex-grow:1; padding-left:10px;">
			{#if setting instanceof AJ.CheckboxSetting}
				<Checkbox bind:checked={setting.value} />
			{:else if setting instanceof AJ.NumberSetting}
				<Number bind:value={setting.value} step={setting.step} />
			{:else if setting instanceof AJ.InlineTextSetting}
				<TextInline bind:value={setting.value} />
			{:else if setting instanceof AJ.DropdownSetting}
				<Dropdown bind:value={setting.value} options={setting.options} />
			{:else if setting instanceof AJ.FolderSetting}
				<Folder bind:value={setting.value} />
			{:else if setting instanceof AJ.FileSetting}
				<File bind:value={setting.value} />
			{:else if setting instanceof AJ.ImageDropdownSetting}
				<ImageDropdown bind:value={setting.value} options={setting.options} />
			{/if}
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

	{#if setting instanceof AJ.CodeboxSetting}
		<Codebox bind:value={setting.value} language={setting.language} />
	{/if}

	<div class="spacer" />

	{#if descriptionVisible}
		<div
			class="setting-description flex-column"
			in:slide={{ delay: 500, duration: 250 }}
			out:slide={{ duration: 250 }}
			on:introstart={() => onDescriptionTransition('introstart')}
			on:introend={() => onDescriptionTransition('introend')}
			on:outrostart={() => onDescriptionTransition('outrostart')}
			on:outroend={() => onDescriptionTransition('outroend')}
		>
			{#each setting.description as line, index}
				<p
					class="setting-description"
					in:fly={{ x: -20, delay: 700 + 100 * index, duration: 500 }}
				>
					{line}
				</p>
			{/each}
		</div>
	{/if}

	{#if setting.infoPopup}
		<div transition:slide={{ duration: 200 }}>
			<SettingInfoPopup type={setting.infoPopup.type} popup={setting.infoPopup} />
		</div>
	{/if}
</div>

<style>
	p {
		display: inline-block;
	}

	p.setting-name {
		width: 150px;
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

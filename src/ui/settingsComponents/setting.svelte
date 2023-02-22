<script lang="ts">
	import * as Settings from '../../settings'
	import { defer } from '../../util'
	import SettingInfoPopup from './settingInfoPopup.svelte'
	import ResetButton from './resetButton.svelte'
	import { fly, slide } from 'svelte/transition'
	import Checkbox from './settingDisplays/checkbox.svelte'
	import Number from './settingDisplays/number.svelte'
	import TextInline from './settingDisplays/textInline.svelte'
	import Dropdown from './settingDisplays/dropdown.svelte'
	import Folder from './settingDisplays/folder.svelte'

	export let setting: Settings.AJSetting<any>
	let loaded = false
	let helpButtonHovered = false

	defer(() => {
		loaded = true
	})

	setting._onInit()

	$: {
		setting._onUpdate()
	}

	function onResetClick() {
		console.log(`Setting '${setting.displayName}' reset!`)
		setting.value = setting.defaultValue
	}

	function onHelpButtonClick() {
		console.log(`Help button clicked for setting '${setting.displayName}'`)
	}
</script>

{#if loaded}
	<div class="setting flex_column" style="align-items:stretch;">
		<div class="flex_row" style="justify-content:space-between;">
			<div class="flex">
				<p class="setting-name">{setting.displayName}</p>
			</div>
			<div class="flex" style="justify-content:flex-end; flex-grow:1; padding-left:10px;">
				{#if setting instanceof Settings.AJCheckboxSetting}
					<Checkbox bind:checked={setting.value} />
				{:else if setting instanceof Settings.AJNumberSetting}
					<Number bind:value={setting.value} step={setting.step} />
				{:else if setting instanceof Settings.AJInlineTextSetting}
					<TextInline bind:value={setting.value} />
				{:else if setting instanceof Settings.AJDropdownSetting}
					<Dropdown bind:value={setting.value} options={setting.options} />
				{:else if setting instanceof Settings.AJFolderSetting}
					<Folder bind:value={setting.value} />
				{/if}
			</div>

			{#if setting.resettable}
				<ResetButton onClick={onResetClick} />
			{/if}

			<button
				class="help-button"
				on:click={onHelpButtonClick}
				on:mouseenter={() => (helpButtonHovered = true)}
				on:mouseleave={() => (helpButtonHovered = false)}
			>
				<span class="material-icons" style="margin:0px">question_mark</span>
			</button>
		</div>

		{#if helpButtonHovered}
			<div
				class="setting-description flex_column"
				in:slide={{ delay: 500, duration: 250 }}
				out:slide={{ duration: 250 }}
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

		{#if setting.errors.length > 0 || setting.warnings.length > 0}
			<div transition:slide={{ duration: 200 }}>
				{#if setting.errors.length > 0}
					<SettingInfoPopup type={'error'} infos={setting.errors} />
				{/if}
				{#if setting.warnings.length > 0}
					<SettingInfoPopup type={'warning'} infos={setting.warnings} />
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	p {
		display: inline-block;
	}

	p.setting-name {
		width: 150px;
	}

	div.setting-description {
		pointer-events: none;
		background: var(--color-dark);
		padding-left: 5px;
		padding-right: 5px;
		padding-bottom: 5px;
		margin-top: 10px;
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

	div.flex_column {
		display: flex;
		align-items: center;
		flex-direction: column;
		align-items: flex-start;
	}

	div.flex_row {
		display: flex;
		align-items: center;
		flex-direction: row;
	}

	button.help-button {
		all: unset !important;

		display: flex !important;
		justify-content: center !important;
		align-content: center !important;
		flex-wrap: wrap !important;

		background-color: var(--color-button) !important;
		height: 34px !important;
		width: 34px !important;
		line-height: 10px !important;
		font-size: 20px !important;
		margin-left: 10px !important;
	}

	button.help-button:hover {
		color: var(--color-accent_text) !important;
		background-color: var(--color-accent) !important;
	}
</style>

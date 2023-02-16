<script lang="ts">
	import { onDestroy } from 'svelte'
	import { fly } from 'svelte/transition'
	import { bounceOut } from 'svelte/easing'
	import * as Settings from '../../settings'
	import { objectEqual } from '../../util'
	import HelpButton from './helpButton.svelte'

	export let setting: Settings.Setting<any, any>

	let storedSetting = setting.pull()

	const settingUnsub = setting.subscribe(settingData => {
		storedSetting = settingData
	})

	onDestroy(() => {
		settingUnsub()
	})

	$: {
		if (!objectEqual(storedSetting, setting.pull())) {
			setting.push(storedSetting)
			console.log('Setting changed!', setting.info.displayName, storedSetting)
		}
	}
</script>

<div class="setting flex_column" style="align-items:stretch;">
	<div class="flex_row" style="justify-content:space-between;">
		<div class="flex">
			<p>{setting.info.displayName}</p>
		</div>
		<div class="flex" style="justify-content:flex-end; flex-grow:1; padding-left:10px;">
			{#if setting instanceof Settings.BooleanSetting && setting.info.displayType == 'checkbox'}
				<input type="checkbox" bind:checked={storedSetting.value} />
			{/if}

			{#if setting instanceof Settings.NumberSetting && setting.info.displayType == 'int'}
				<input type="number" class="number" step="1" bind:value={storedSetting.value} />
			{/if}

			{#if setting instanceof Settings.NumberSetting && setting.info.displayType == 'float'}
				<input type="number" class="number" step="0.1" bind:value={storedSetting.value} />
			{/if}

			{#if setting instanceof Settings.TextSetting && setting.info.displayType == 'inline'}
				<input type="text" class="text_inline" bind:value={storedSetting.value} />
			{/if}

			{#if setting instanceof Settings.RecordSetting && setting.info.displayType == 'dropdown'}
				<select bind:value={storedSetting.value}>
					{#each Object.entries(setting.options) as [key, value]}
						<option value={key}>{value}</option>
					{/each}
				</select>
			{/if}

			<HelpButton {setting} />
		</div>
	</div>
	{#if storedSetting.warning}
		<div class="flex_row warning" in:fly={{ y: -25, duration: 500, easing: bounceOut }}>
			<div class="material-icons" style="margin-right:5px">warning</div>
			<div>{storedSetting.warning}</div>
		</div>
	{/if}
	{#if storedSetting.error}
		<div class="flex_row error" in:fly={{ y: -25, duration: 500, easing: bounceOut }}>
			<div class="material-icons" style="margin-right:5px">error</div>
			<div>{storedSetting.error}</div>
		</div>
	{/if}
</div>

<style>
	.warning {
		color: var(--color-warning);
	}

	.error {
		color: var(--color-error);
	}

	p {
		display: inline-block;
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

	.text_inline {
		background: var(--color-dark);
		font-family: var(--font-code);
		flex-grow: 1;
		padding: 5px;
		padding-left: 11px;
		padding-right: 11px;
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

	.number {
		border: none;
		background: var(--color-button);
		display: inline-block;
		text-align: center;
		vertical-align: middle;
		cursor: default;
		outline: none;
		height: 32px;
		min-width: 100px;
		width: auto;
		color: var(--color-text);
		padding-right: 16px;
		padding-left: 16px;
		font-weight: normal;
		cursor: pointer;
	}
</style>

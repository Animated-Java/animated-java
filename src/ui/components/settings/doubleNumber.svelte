<script lang="ts">
	import type * as AJ from '../../../settings'
	import SettingContainer from '../settingContainer.svelte'

	export let setting: AJ.DoubleNumberSetting
	//
</script>

<SettingContainer {setting}>
	<div class="container" slot="inline">
		{#if setting.firstNumberLabel}
			<div class="label">{setting.firstNumberLabel}</div>
		{/if}
		<input type="number" step={setting.step} bind:value={setting.numberA} />
		{#if setting.secondNumberLabel}
			<div class="label">{setting.secondNumberLabel}</div>
		{/if}
		<input type="number" step={setting.step} bind:value={setting.numberB} />
	</div>
</SettingContainer>

<style>
	.container {
		display: flex;
		align-items: center;
	}

	.label {
		margin: 0px 10px;
	}

	input[type='number'] {
		border: none;
		background: var(--color-button);
		display: inline-block;
		text-align: center;
		vertical-align: middle;
		cursor: default;
		outline: none;
		height: 34px;
		width: 6em;
		color: var(--color-text);
		padding-right: 16px;
		padding-left: 16px;
		font-weight: normal;
		cursor: text;
		text-align: left;
	}
</style>

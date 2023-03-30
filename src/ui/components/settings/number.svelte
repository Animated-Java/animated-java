<script lang="ts">
	import type * as AJ from '../../../settings'
	import SettingContainer from '../settingContainer.svelte'

	export let setting: AJ.NumberSetting
</script>

<SettingContainer {setting}>
	<input
		slot="inline"
		type="number"
		class="number"
		step={setting.step}
		bind:value={setting.value}
	/>
</SettingContainer>

<style>
	.number {
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

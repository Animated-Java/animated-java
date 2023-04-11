<script lang="ts">
	import SettingContainer from '../settingContainer.svelte'
	import type * as AJ from '../../../settings'

	export let setting: AJ.InlineTextSetting
	//
</script>

<SettingContainer {setting}>
	<input
		slot="inline"
		type="text"
		class="text_inline"
		bind:value={setting.value}
		title={setting.value}
	/>
</SettingContainer>

<style>
	.text_inline {
		background: var(--color-button);
		font-family: var(--font-code);
		flex-grow: 1;
		padding: 5px;
		padding-left: 11px;
		padding-right: 11px;
		height: unset;
	}
</style>

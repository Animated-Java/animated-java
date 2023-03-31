<script lang="ts">
	import SettingContainer from '../settingContainer.svelte'
	import type * as AJ from '../../../settings'

	export let setting: AJ.DropdownSetting
</script>

<SettingContainer {setting}>
	<select slot="inline" bind:value={setting.value}>
		{#each setting.options as option, index}
			<option value={index}>
				<div>{option.name}</div>
			</option>
		{/each}
	</select>
</SettingContainer>

<style>
	select {
		height: 34px;
	}
</style>

<script lang="ts">
	import SettingContainer from '../settingContainer.svelte'
	import type * as AJ from '../../../settings'

	export let setting: AJ.CheckboxSetting
	//
</script>

<SettingContainer {setting}>
	<input slot="inline" type="checkbox" bind:checked={setting.value} />
</SettingContainer>

<style>
	input {
		height: unset;
	}
</style>

<script lang="ts">
	import * as AJSettings from '../settings'
	import Setting from './settingsComponents/setting.svelte'

	export let settings: Record<string, AJSettings.AJSetting<any>>

	console.log(settings)
	const settingArray = Object.values(settings)
</script>

<div>
	{#each settingArray as setting}
		<Setting {setting} />
	{/each}
</div>

<style>
</style>

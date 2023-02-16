<script lang="ts">
	// import { onDestroy } from 'svelte'
	// import { Subscribable } from '../util/suscribable'
	import * as AJSettings from '../settings'
	import Setting from './settingsComponents/setting.svelte'

	export let settings: Record<string, AJSettings.Setting<any, any>>

	console.log(settings)
	const settingArray = Object.values(settings)

	// export let onCloseHandler: Subscribable<void> = new Subscribable<void>()
	// let unsub: () => void
	// $: unsub = onCloseHandler.subscribe(() => {
	// 	console.log('onCloseHandler')
	// })
	// onDestroy(() => {
	// 	unsub()
	// })
</script>

<div>
	{#each settingArray as setting}
		<Setting {setting} />
		<!-- {#if settingArray.indexOf(setting) < settingArray.length - 1}
			<hr />
		{/if} -->
	{/each}
</div>

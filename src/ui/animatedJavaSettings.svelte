<script lang="ts">
	// import { onDestroy } from 'svelte'
	// import { Subscribable } from '../util/suscribable'
	import { AnimatedJavaSettings } from '../settings'
	import Setting from './settingsComponents/setting.svelte'

	console.log(AnimatedJavaSettings)
	const settingArray = Object.values(AnimatedJavaSettings)

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

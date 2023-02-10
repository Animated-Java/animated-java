<script lang="ts">
	import { onDestroy } from 'svelte'
	import { Subscribable } from '../util/suscribable'
	import Checkbox from './settingsComponents/checkbox.svelte'
	import Number from './settingsComponents/number.svelte'
	import { AnimatedJavaSettings } from '../settings'

	console.log(AnimatedJavaSettings)

	export let onCloseHandler: Subscribable<void> = new Subscribable<void>()
	let unsub: () => void
	$: unsub = onCloseHandler.subscribe(() => {
		console.log('onCloseHandler')
	})
	onDestroy(() => {
		unsub()
	})
</script>

<div>
	{#each Object.values(AnimatedJavaSettings) as setting}
		{#if setting.info.dataType === 'boolean' && setting.info.displayType == 'checkbox'}
			<Checkbox {setting} />
		{/if}
		{#if setting.info.dataType === 'number' && setting.info.displayType == 'int'}
			<Number {setting} />
		{/if}
	{/each}
</div>

<style>
</style>

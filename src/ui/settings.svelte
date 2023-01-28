<script lang="ts">
	import { onDestroy } from 'svelte'
	import { Subscribable } from '../util/suscribable'
	import Checkbox from './settingsComponents/checkbox.svelte'

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
	<h1>Animated Java</h1>
	<p>Greetings!</p>
	<Checkbox />
</div>

<style>
</style>

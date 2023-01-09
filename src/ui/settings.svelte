<script lang="ts">
	import { onDestroy } from 'svelte'
	import { Subscribable } from '../util/Suscribable'

	export let onCloseHandler: Subscribable<void> = new Subscribable<void>()
	let unsub: () => void
	$: unsub = onCloseHandler.subscribe(() => {
		console.log('onCloseHandler')
	})
	onDestroy(() => {
		unsub()
	})
</script>

<h1>Hi from Svelteland!</h1>

<style>
	h1 {
		color: red;
		text-transform: uppercase;
	}
</style>

<script lang="ts">
	import { onDestroy } from 'svelte'

	export let x: string = ''
	let y: string = ''
	$: y = x
	const timeout = setInterval(() => {
		y = [...y].reverse().join('')
	}, 1000)
	onDestroy(() => {
		clearInterval(timeout)
	})
</script>

<div>{y}</div>

<style>
	div {
		color: red;
	}
</style>

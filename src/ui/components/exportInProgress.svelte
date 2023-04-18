<script lang="ts" context="module">
	import { tweened } from 'svelte/motion'
	import { cubicOut } from 'svelte/easing'
</script>

<script lang="ts">
	import { onDestroy } from 'svelte'

	jQuery('.dialog_close_button').remove()

	const progress = tweened(0, {
		duration: 100,
		easing: cubicOut,
	})

	const interval = setInterval(() => {
		// @ts-ignore
		progress.set(Prop.progress)
	}, 16)

	onDestroy(() => {
		clearInterval(interval)
	})
</script>

<div class="progress-bar-container">
	<progress value={$progress} />
</div>

<style>
	.progress-bar-container {
		display: flex;
		flex-direction: row;
		align-items: center;
	}
	progress {
		flex-grow: 1;
	}
</style>

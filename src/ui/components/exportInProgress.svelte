<script lang="ts" context="module">
	import { tweened } from 'svelte/motion'
	import { cubicOut } from 'svelte/easing'
</script>

<script lang="ts">
	import { onDestroy } from 'svelte'
	let text = AnimatedJava.progress_text
	let value = AnimatedJava.progress

	jQuery('.dialog_close_button').remove()

	const progress = tweened(0, {
		duration: 100,
		easing: cubicOut,
	})

	const interval = setInterval(() => {
		if ($value < $progress) {
			progress.set($value, { duration: 0 })
		} else progress.set($value)
	}, 16)

	onDestroy(() => {
		clearInterval(interval)
	})
</script>

<div class="progress-bar-container">
	<p>{$text || 'Exporting...'}</p>
	<progress value={$progress} />
</div>

<style>
	.progress-bar-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	progress {
		flex-grow: 1;
		width: 100%;
	}
</style>

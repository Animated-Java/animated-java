<script lang="ts" module>
	import { type Observable } from 'svelte-observable-store'
	import ArmorStandRunningGif from '../../assets/armor_stand_running.webp'
</script>

<script lang="ts">
	export let progress: Observable<number>
	export let maxProgress: Observable<number>
	export let progressDescription: Observable<string>
</script>

<div class="dialog-container">
	<div class="progress-container">
		<p>{$progressDescription}</p>
		<!-- svelte-ignore a11y_missing_attribute -->
		<img src={ArmorStandRunningGif} width="64px" />
	</div>
	{#if $progress !== 0}
		<progress value={$progress / $maxProgress || 0} max="1"></progress>
	{/if}
</div>

<style>
	.dialog-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.progress-container {
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}

	progress {
		width: 100%;
	}
</style>

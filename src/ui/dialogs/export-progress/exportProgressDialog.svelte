<script lang="ts">
	import ArmorStandRunningGif from '@assets/armor_stand_running.webp'
	import { Syncable } from '../../../util/stores'

	export let progress: Syncable<number>
	export let maxProgress: Syncable<number>
	export let progressDescription: Syncable<string>
</script>

<div class="dialog-container">
	<div class="progress-container">
		<p>{$progressDescription}</p>
		<!-- svelte-ignore a11y-missing-attribute -->
		<img src={ArmorStandRunningGif} width="64px" />
	</div>
	{#if $progress !== 0}
		<progress value={$progress / $maxProgress || 0} max="1" />
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

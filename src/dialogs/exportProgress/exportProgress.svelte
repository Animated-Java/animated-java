<script lang="ts" module>
	import { type Observable } from 'svelte-observable-store'
	import ArmorStandRunningGif from '../../assets/armor_stand_running.webp'
</script>

<script lang="ts">
	export let progress: Observable<number>
	export let maxProgress: Observable<number>
	export let progressDescription: Observable<string>
	export let progressDetail: Observable<string>
	export let subProgress: Observable<number>
	export let subMaxProgress: Observable<number>

	$: primaryValue = $maxProgress > 0 ? $progress / $maxProgress : 0
	$: secondaryValue = $subMaxProgress > 0 ? $subProgress / $subMaxProgress : 0
</script>

<div class="dialog-container">
	<div class="header">
		<div class="labels">
			<p class="description">{$progressDescription}</p>
			{#if $progressDetail}
				<p class="detail" title={$progressDetail}>{$progressDetail}</p>
			{/if}
		</div>
		<!-- svelte-ignore a11y_missing_attribute -->
		<img src={ArmorStandRunningGif} width="64px" />
	</div>

	{#if $progress !== 0}
		<div class="bar-row">
			<progress value={primaryValue} max="1"></progress>
			<span class="count">{$progress}/{$maxProgress}</span>
		</div>
	{/if}

	{#if $subMaxProgress > 0}
		<div class="bar-row secondary">
			<progress value={secondaryValue} max="1"></progress>
			<span class="count">{$subProgress}/{$subMaxProgress}</span>
		</div>
	{/if}
</div>

<style>
	.dialog-container {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 8px;
	}

	.header {
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.labels {
		display: flex;
		flex-direction: column;
		min-width: 0;
		gap: 2px;
	}

	.description {
		margin: 0;
	}

	.detail {
		margin: 0;
		font-size: 0.85em;
		color: var(--color-subtle_text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.bar-row {
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8px;
	}

	.bar-row progress {
		flex: 1 1 auto;
		min-width: 0;
		height: 16px;
	}

	.bar-row.secondary progress {
		height: 10px;
	}

	.count {
		flex: 0 0 auto;
		font-size: 0.8em;
		color: var(--color-subtle_text);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>

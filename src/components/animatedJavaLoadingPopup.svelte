<script lang="ts" context="module">
	import { onMount } from 'svelte'
	import RunningArmorStand from '../assets/armor_stand_running.webp'
	import { type Valuable } from '../util/stores'
</script>

<script lang="ts">
	import { translate } from '../util/translation'

	export let loaded: Valuable<boolean>
	export let offline: Valuable<boolean>
	export let progress: Valuable<number>
	export let progressLabel: Valuable<string>
</script>

<div class={`floating ${$offline ? 'red-border' : 'blue-border'}`}>
	{#if $offline}
		<div style="display: flex; flex-direction: column;">
			{@html translate('popup.loading.offline')
				.split('\n')
				.map(v => '<p>' + v + '</p>')
				.join('')}
		</div>
	{:else if $loaded}
		<div>{translate('popup.loading.success')}</div>
	{:else}
		<div style="display: flex; flex-direction:row;">
			<div class="text">{translate('popup.loading.loading')}</div>
			<img src={RunningArmorStand} alt="Running Armor Stand" />
		</div>
		{#if $progressLabel !== '' || $progress !== 0}
			<div>{$progressLabel}</div>
			<progress value={$progress} max="100"></progress>
		{/if}
	{/if}
</div>

<style>
	.floating {
		position: absolute;
		bottom: 2rem;
		right: 2rem;
		background: var(--color-ui);
		padding: 8px 16px;
		display: flex;
		align-items: center;
		flex-direction: column;
	}
	.blue-border {
		border: 1px solid var(--color-accent);
	}
	.red-border {
		border: 1px solid var(--color-error);
	}
	.text {
		margin-right: 16px;
	}
	img {
		width: 32px;
		height: 32px;
		margin: -4px -10px;
	}
	progress {
		width: 100%;
	}
</style>

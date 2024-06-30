<script lang="ts" context="module">
	import RunningArmorStand from '../assets/armor_stand_running.gif'
	import { type Valuable } from '../util/stores'
</script>

<script lang="ts">
	import { translate } from '../util/translation'

	export let loaded: Valuable<boolean>
	export let offline: Valuable<boolean>
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
		<div class="text">{translate('popup.loading.loading')}</div>
		<img src={RunningArmorStand} alt="Running Armor Stand" />
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
		flex-direction: row;
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
		margin: -16px -10px;
	}
</style>

<script lang="ts" context="module">
	import RunningArmorStand from '../assets/armor_stand_running.gif'
	import { type Valuable } from '../util/stores'
</script>

<script lang="ts">
	export let loaded: Valuable<boolean>
</script>

<div class="floating">
	{#if $loaded}
		<div>Animated Java Loaded Successfully!</div>
	{:else}
		<div class="text">Loading Animated Java...</div>
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
		border: 1px solid var(--color-accent);
		display: flex;
		align-items: center;
		flex-direction: row;
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

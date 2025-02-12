<script lang="ts">
	import { Valuable } from '../../../util/stores'
	import ArmorStandRunningGif from '../assets/armor_stand_running.webp'

	export let progress: Valuable<number>
	export let maxProgress: Valuable<number>
</script>

<div>
	<progress value={$progress} max={$maxProgress} />
	<!-- svelte-ignore a11y-missing-attribute -->
	<img src={ArmorStandRunningGif} width="64" />
</div>

<style>
	div {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	img {
		margin-left: 16px;
	}
	progress {
		flex-grow: 1;
	}
</style>

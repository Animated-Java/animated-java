<script lang="ts" context="module">
	import { Valuable } from '../util/stores'
	import ArmorStandRunningGif from '../assets/armor_stand_running.gif'
</script>

<script lang="ts">
	export let log: Valuable<string>
	export let progress: Valuable<number>
	export let maxProgress: Valuable<number>
	function scrollToBottom(node: HTMLElement, update: any) {
		const scroll = () => {
			node.scroll({
				top: node.scrollHeight,
				behavior: 'smooth',
			})
		}
		scroll()
		return { update: scroll }
	}
</script>

<div class="dialog-container">
	<code use:scrollToBottom={$log}>
		{#each $log.split('\n') as line}
			<pre>{line}</pre>
		{/each}
	</code>
	<!-- svelte-ignore a11y-missing-attribute -->
	<img src={ArmorStandRunningGif} width="64px" />
	<progress value={$progress / $maxProgress || 0} max="1" />
</div>

<style>
	.dialog-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	progress {
		width: 100%;
	}

	img {
		position: absolute;
		right: 32px;
		bottom: 38px;
	}

	code {
		text-align: left;
		background-color: var(--color-back);
		border: 1px solid var(--color-border);
		padding: 0.25rem 0.75rem;
		overflow: auto;
		height: 30rem;
		font-size: 12px;
		width: 100%;
		scroll-behavior: smooth;
	}

	pre {
		font-family: var(--font-code);
	}
</style>

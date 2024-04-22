<script lang="ts" context="module">
	import { Valuable } from '../util/stores'
</script>

<script lang="ts">
	export let log: Valuable<string>
</script>

<div class="dialog-container">
	<code>
		{#each $log.split('\n') as line}
			<pre>{line}</pre>
		{/each}
	</code>
</div>

<style>
	.dialog-container {
		display: flex;
		flex-direction: column;
	}

	code {
		text-align: left;
		background-color: var(--color-back);
		border: 1px solid var(--color-border);
		padding: 0.25rem 0.75rem;
		overflow: auto;
		height: 30rem;
		font-size: 12px;
	}

	pre {
		font-family: var(--font-code);
	}
</style>

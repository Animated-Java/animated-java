<script lang="ts" context="module">
	Prism.languages.error = {
		error: {
			pattern: /^Error:/,
		},
	}
</script>

<script lang="ts">
	import { translate } from '../../../util/translation'
	import PrismCodebox from '../prism/prismCodebox.svelte'

	export let error: any
</script>

<div class="content">
	<div class="flex-column loading" style="flex-grow:1;">
		<h1>{translate('animated_java.popup.unexpectedError.title')}</h1>
		{#each translate('animated_java.popup.unexpectedError.body').split('\n') as line}
			<p>{line}</p>
		{/each}
		<div>
			<a href="https://github.com/Animated-Java/animated-java">
				<i class="fa-brands fa-github github-icon" />
			</a>
			<a href="https://animated-java.dev/discord">
				<i class="fa-brands fa-discord discord-icon" />
			</a>
		</div>
		<br />
		<div class="prism-container">
			<PrismCodebox language="error" code={error.stack} />
		</div>
	</div>
</div>

<style>
	.discord-icon {
		font-size: 2em;
		color: #454fbf;
		padding: 10px;
	}

	.github-icon {
		font-size: 2em;
		color: white;
		padding: 10px;
	}

	p {
		margin: 0px;
	}

	div.flex-column {
		display: flex;
		align-items: center;
		flex-direction: column;
	}

	div.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	div.content {
		display: flex;
		overflow-y: scroll;
		max-height: 700px;
	}

	div.prism-container {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: center;
		flex-grow: 1;

		background-color: var(--color-back);
		border: 2px solid var(--color-border);
		border-radius: 0.25em;
		text-align: start;

		max-height: 20em;
		max-width: 580px;
		padding-left: 8px;
		padding-top: 3px;
	}
</style>

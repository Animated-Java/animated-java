<script lang="ts" context="module">
	// import { type Writable } from 'svelte/store'
	//
</script>

<script lang="ts">
	export let page: IDocsManifestPage
	//
</script>

{@html page.content}

<style global>
	.animated-java-page-container {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}
	.animated-java-page-container img {
		border: 0.25em solid var(--color-dark);
		border-radius: 0.5em;
		image-rendering: auto;
		max-width: 660px;
	}
	.animated-java-page-container p {
		margin: 5px 20px;
	}
	.animated-java-page-container p.image-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.animated-java-page-container a {
		text-decoration: underline;
		cursor: pointer;
	}
	.animated-java-page-container a:hover {
		color: var(--color-accent);
	}
	.animated-java-page-container li {
		list-style: unset;
		padding: 5px 0px;
	}
	.animated-java-page-container blockquote {
		border-left: 4px solid var(--color-accent);
		background-color: var(--color-button);
		padding-left: 1em;
	}
	.animated-java-page-container code {
		background-color: var(--color-back);
		border: unset;
		user-select: text;
		font-family: var(--font-code);
		font-size: 0.85em;
		display: inline-flex;
		padding: 0em 0.5em;
		border-radius: 0.2em;
	}
	.animated-java-page-container pre {
		background-color: var(--color-back);
		border: 2px solid var(--color-border);
		border-radius: 0.25em;
		margin: 0.5em 1em;
		padding: 0.25em 0.5em;
		overflow-x: auto;
		display: inline-table;
		white-space: pre-wrap;
		width: fit-content;
	}
	.animated-java-page-container pre div div {
		all: unset;
		font-size: 0.8em;
		font-family: var(--font-code);
		cursor: text;
		user-select: text;
	}
	.animated-java-page-container pre code {
		all: unset;
		font-size: 0.8em;
		font-family: var(--font-code);
		cursor: text;
		user-select: text;
	}
	.animated-java-page-container h1 {
		display: flex;
		justify-content: center;
		align-items: center;
		text-align: center;
		font-size: 3em;
		flex-direction: column;
		background: var(--color-button);
		border-bottom: 2px solid var(--color-accent);
	}
	.animated-java-page-container h2 {
		display: flex;
		justify-content: center;
		flex-direction: column;
		font-weight: unset;
		margin: 20px 0px 10px;
		align-items: flex-start;
		padding: 10px 20px;
		background: var(--color-button);
		border-bottom: 2px solid var(--color-accent);
	}
	.animated-java-page-container h3 {
		display: flex;
		justify-content: center;
		font-weight: unset;
		align-items: flex-start;
		flex-direction: column;
		box-sizing: unset;
		font-size: 1.5em;
		background: var(--color-button);
		padding: 5px 10px 5px 10px;
		border-left: 2px solid var(--color-accent);
	}
	.animated-java-page-container h6 {
		font-style: italic;
		opacity: 0.76;
		font-size: 0.9em;
		font-weight: normal;
	}
	.animated-java-page-container h4 {
		display: flex;
		justify-content: center;
		font-weight: unset;
		margin: 10px 16px 0px;
		align-items: flex-start;
		flex-direction: column;
		box-sizing: unset;
		font-size: 20px;
	}
	.animated-java-page-container ol,
	.animated-java-page-container ul {
		margin-left: 2em;
	}
	.animated-java-page-container li {
		list-style: unset;
		padding: 5px 0px;
	}
</style>

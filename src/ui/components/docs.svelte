<script lang="ts">
	import { translate } from '../../translation'
	import IndexItem from './docs/indexItem.svelte'
	import TextAreaAutosize from './textAreaAutosize.svelte'

	const DOC_API_URL = 'http://localhost:3000/api/docs'
	const DOC_URL = 'http://localhost:3000/docs/'

	// 'api/docs' returns the index.json
	// 'docs/<filename>.embed' returns the rendered html of the document

	async function getDocIndex() {
		// await new Promise(resolve => setTimeout(resolve, 1000))
		return await fetch(DOC_API_URL)
			.then(response => response.json())
			.catch(error => {
				throw new Error('Failed to fetch docIndex.\n' + error.stack)
			})
	}

	async function getPage(name: string) {
		// await new Promise(resolve => setTimeout(resolve, 1000))
		return await fetch(DOC_URL + name + '.embed')
			.then(response => response.text())
			.catch(error => {
				throw new Error('Failed to fetch docIndex.\n' + error.stack)
			})
	}
</script>

{#await getDocIndex()}
	<div class="flex-column loading">
		<h1>{translate('animated_java.dialog.documentation.loading')}</h1>
		<div class="spin">
			<span class="material-icons" style="transform: scale(2); margin:0px">sync</span>
		</div>
	</div>
{:then index}
	<div class="flex-row" style="align-items:stretch;">
		<div class="flex-column nav-panel">
			{#each Object.values(index['index.mdx'].children) as localIndex}
				<IndexItem index={localIndex} />
			{/each}
		</div>
		<div class="flex-column">
			{#await getPage('_template/_markdown_examples')}
				<div class="flex-column loading">
					<h1>{translate('animated_java.dialog.documentation.loading')}</h1>
					<div class="spin">
						<span class="material-icons" style="transform: scale(2); margin:0px"
							>sync</span
						>
					</div>
				</div>
			{:then page}
				<div class="content">{@html page}</div>
			{:catch}
				<p>ur bad</p>
			{/await}
		</div>
	</div>
{:catch error}
	<div class="content">
		<div class="flex-column loading">
			<h1>{translate('animated_java.dialog.documentation.error.failed_to_load.title')}</h1>
			{#each translate('animated_java.dialog.documentation.error.failed_to_load.description').split('\n') as line}
				<p>{line}</p>
			{/each}
			<br />
			<TextAreaAutosize value={error.stack} minRows={2} />
		</div>
	</div>
{/await}

<style>
	div.flex-column {
		display: flex;
		align-items: center;
		flex-direction: column;
		align-items: flex-start;
	}

	div.flex-row {
		display: flex;
		align-items: center;
		flex-direction: row;
	}

	div.loading {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	div.nav-panel {
		background-color: var(--color-back);
		margin-right: 10px;
		padding: 10px;
		align-items: stretch;
	}

	div.content {
		overflow-y: scroll;
		max-height: 700px;
	}

	p {
		margin: 0px;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(calc(-360deg * 2));
		}
	}

	.spin {
		display: flex;
		align-items: center;
		justify-content: center;
		animation: spin 1.25s ease-in-out infinite;
	}
</style>

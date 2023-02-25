<script lang="ts">
	import { translate } from '../../translation'
	import DocPage from './docs/docPage.svelte'
	import IndexItem from './docs/indexItem.svelte'
	import TextAreaAutosize from './textAreaAutosize.svelte'

	export let firstPage: string = 'index'
	export let openToSection: string | undefined

	const DOC_API_URL = 'http://localhost:3000/api/docs'
	const DOC_URL = 'http://localhost:3000/docs/'

	// 'api/docs' returns the index.json
	// 'docs/<filename>.embed' returns the rendered html of the document

	async function getDocIndex() {
		// await new Promise(resolve => setTimeout(resolve, 1000))
		const response = await fetch(DOC_API_URL)
			.then(response => response.json())
			.catch(error => {
				throw new Error('Failed to fetch docIndex.\n' + error.stack)
			})
		console.log('docIndex', response)
		return response
	}

	async function getPage(name: string) {
		if (name === '') name = 'index'
		// await new Promise(resolve => setTimeout(resolve, 1000))
		return await fetch(DOC_URL + name + '.embed')
			.then(response => response.text())
			.catch(error => {
				throw new Error('Failed to fetch docIndex.\n' + error.stack)
			})
	}

	let selectedPage: string = firstPage
	function changePage(page: string) {
		selectedPage = page
	}

	function scrollToSection(section: string) {
		const el = document.getElementById(section)
		console.log('scrollToSection', section, el)
		if (el) el.scrollIntoView()
	}

	function onload(el: any) {
		if (openToSection) scrollToSection(openToSection)
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
				<IndexItem index={localIndex} {changePage} bind:selectedPage />
			{/each}
		</div>
		<div class="flex-column">
			{#key selectedPage}
				{#await getPage(selectedPage)}
					<div class="flex-column loading">
						<h1>{translate('animated_java.dialog.documentation.loading')}</h1>
						<div class="spin">
							<span class="material-icons" style="transform: scale(2); margin:0px"
								>sync</span
							>
						</div>
					</div>
				{:then page}
					<div class="content page-content" use:onload>
						<DocPage {page} />
					</div>
				{:catch}
					<p>ur bad</p>
				{/await}
			{/key}
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
			<TextAreaAutosize value={error.stack} maxWidth={'680px'} maxHeight={'400px'} />
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
		align-items: stretch;
		min-width: 12em;
		border: 2px solid var(--color-border);
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

	div.content {
		overflow-y: scroll;
		max-height: 700px;
	}
	div.page-content {
		padding-left: 1em;
	}
</style>

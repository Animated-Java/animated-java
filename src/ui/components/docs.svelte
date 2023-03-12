<script lang="ts">
	import { fade } from 'svelte/transition'
	import * as events from '../../events'
	import { translate } from '../../util/translation'
	import DocPage from './docs/docPage.svelte'
	import IndexItem from './docs/indexItem.svelte'
	import ErrorComponent from './docs/error.svelte'

	export let page: string = 'index'
	export let section: string | undefined

	const DOC_API_URL =
		process.env.NODE_ENV === 'development'
			? 'http://localhost:3000/api/docs'
			: 'https://animated-java.dev/api/docs'

	const DOC_URL =
		process.env.NODE_ENV === 'development'
			? 'http://localhost:3000/docs/'
			: 'https://animated-java.dev/docs'

	// 'api/docs' returns the index.json
	// 'docs/<filename>.embed' returns the rendered html of the document

	async function getDocIndex() {
		// await new Promise(resolve => setTimeout(resolve, 2000))
		// throw new Error('Skill Issue!')
		const response = await fetch(DOC_API_URL)
			.then(response => response.json())
			.catch(error => {
				throw new Error('Failed to fetch docIndex.\n' + error.stack)
			})
		// console.log('docIndex', response)
		return response
	}

	async function getPage(name: string): Promise<string> {
		if (name === '') name = 'index'
		// await new Promise(resolve => setTimeout(resolve, 2000))
		const result = await fetch(DOC_URL + name + '.embed')
			.then(response => response.text())
			.catch(error => {
				throw new Error('Failed to fetch docIndex.\n' + error.stack)
			})

		if (result.toLowerCase() === 'not found') return getPage('meta/undocumented')

		return result
	}

	let selectedPage: string
	function changePage(page: string) {
		selectedPage = page
	}

	function scrollToSection(section: string) {
		const el = document.getElementById(section)
		// console.log('scrollToSection', section, el)
		if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
	}

	let onload = (el: any) => {
		if (section) {
			scrollToSection(section)
			section = undefined
		}
	}

	events.DOCS_LINK_CLICKED.subscribe(event => {
		onload = (el: any) => {
			if (event.section) scrollToSection(event.section)
			event.section = undefined
		}
		changePage(event.link)
	})

	let loaded = false
	queueMicrotask(() => {
		loaded = true
		changePage(page)
	})
</script>

{#await getDocIndex()}
	{#if loaded}
		<div
			class="flex-column loading"
			style="flex-grow:1;"
			in:fade={{ delay: 250, duration: 500 }}
		>
			<h1>{translate('animated_java.dialog.documentation.loading')}</h1>
			<div class="spin">
				<span class="material-icons" style="transform: scale(2); margin:0px">sync</span>
			</div>
		</div>
	{/if}
{:then index}
	<div class="flex-row" style="align-items:stretch; height: 42em;">
		<div class="flex-column nav-panel">
			{#each Object.values(index['index.mdx'].children) as localIndex}
				<IndexItem index={localIndex} {changePage} bind:selectedPage />
			{/each}
		</div>
		<div class="flex-column" style="flex-grow:1;">
			{#key selectedPage}
				{#await getPage(selectedPage)}
					<div
						class="flex-column loading"
						style="flex-grow:1;"
						in:fade={{ delay: 250, duration: 500 }}
					>
						<h1>{translate('animated_java.dialog.documentation.loading')}</h1>
						<div class="spin">
							<span class="material-icons" style="transform: scale(2); margin:0px"
								>sync</span
							>
						</div>
					</div>
				{:then openedPage}
					<div class="content page-content" use:onload>
						<DocPage page={openedPage} />
					</div>
				{:catch error}
					<ErrorComponent {error} />
				{/await}
			{/key}
		</div>
	</div>
{:catch error}
	<ErrorComponent {error} />
{/await}

<style>
	div.flex-column {
		display: flex;
		align-items: center;
		flex-direction: column;
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
		text-align: center;
	}

	div.nav-panel {
		background-color: var(--color-back);
		margin-right: 10px;
		align-items: stretch;
		min-width: 12em;
		border: 2px solid var(--color-border);
		overflow-y: auto;
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
		display: flex;
		overflow-y: scroll;
		max-height: 700px;
	}
	div.page-content {
		padding-left: 0.5em;
	}
</style>

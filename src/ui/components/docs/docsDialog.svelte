<script lang="ts" context="module">
	import { type Writable, writable } from 'svelte/store'
	// import { openAJDocsDialog } from '../../ajDocs'
	import DocsIndexItem from './docsIndexItem.svelte'
	import DocsPage from './docsPage.svelte'
	import * as events from '../../../events'

	const DEV_URL = 'http://localhost:5173'
	const DEV_API = 'http://localhost:5173/api/docs_manifest'
	const DEV_DOCS = 'http://localhost:5173/docs/'
	const PROD_URL = 'https://animated-java-dev-ianssenne.vercel.app'
	const PROD_API = 'https://animated-java-dev-ianssenne.vercel.app/api/docs_manifest'
	const PROD_DOCS = 'https://animated-java-dev-ianssenne.vercel.app/docs/'
	const API = process.env.NODE_ENV === 'development' ? DEV_API : PROD_API
	// const DOCS = process.env.NODE_ENV === 'development' ? DEV_DOCS : PROD_DOCS
	const URL = process.env.NODE_ENV === 'development' ? DEV_URL : PROD_URL

	let manifest: IDocsManifest
	let openPageUrl: Writable<string> = writable('/home')
	const maxAttempts = 2

	async function load(attemptCount: number = 0) {
		manifest = await fetch(API)
			.then(res => {
				if (res.ok) return res.json()
				throw new Error(`Failed to fetch docs manifest. (Attempt ${attemptCount + 1})`)
			})
			.catch(err => {
				// console.error(
				// 	`Failed to fetch docs manifest. (Attempt ${attemptCount + 1})\n` + err.message
				// )
				// retry
				if (attemptCount + 1 >= maxAttempts) {
					console.error(`Failed to fetch docs manifest after ${maxAttempts} attempts.`)
					return
				}
				void load(attemptCount + 1)
			})
		if (!manifest) return
		compilePages()
		// openAJDocsDialog()
	}

	function getPage(pageUrl: string) {
		const page = manifest.pages.find(page => page.url === pageUrl)
		if (!page) throw new Error(`Failed to find page with URL ${pageUrl}`)
		return page
	}

	function compilePages() {
		for (const page of manifest.pages) {
			// Sanitize page content
			// @ts-ignore
			page.content = DOMPurify.sanitize(page.content)
			page.content = page.content.replace(
				/<h([1-6])>(.+?)<\/h[1-6]>/gm,
				(match, p1, p2) =>
					`<h${p1} id="${escape(p2.toLowerCase().replace(' ', '_'))}">${p2}</h${p1}>`
			)
			page.content = page.content.replace(
				/<a href="(.+?)">(.+?)<\/a>/gm,
				`<a class="animated-java-anchor" onclick="AnimatedJava.docClick('$1')">$2</a>`
			)
			page.content = page.content.replace(
				/<img alt="(.+?)" src="(.+?)">/gm,
				(match, p1, p2) => `<img alt="${p1}" src="${URL + p2}">`
			)
		}
	}

	events.DOCS_LINK_CLICKED.subscribe(event => {
		openPageUrl.set(event.link)
	})

	function scrollToSection(section: string) {
		const element = document.getElementById(section)
		if (!element) return
		element.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	void load()
	//
</script>

<script lang="ts">
	export let link: string
	export let section: string | undefined

	function onLoad(event: HTMLDivElement) {
		setTimeout(() => {
			if (link) openPageUrl.set(link)
			if (section) {
				scrollToSection(section.replaceAll('_', '-'))
				console.log(link, section.replaceAll('_', '-'))
			}
		}, 100)
	}

	//
</script>

<div class="docs-container">
	{#if manifest}
		<div class="index-sidebar">
			<div class="index-sidebar-content">
				{#each Object.entries(manifest.structure) as [key, value]}
					<DocsIndexItem {manifest} {openPageUrl} myPageUrl={key} myStructure={value} />
				{/each}
			</div>
			<div />
		</div>
		<div class="animated-java-page-container" use:onLoad>
			<DocsPage page={getPage($openPageUrl)} />
		</div>
	{:else}
		<div>Loading...</div>
	{/if}
</div>

<style>
	.docs-container {
		display: flex;
		flex-direction: row;
	}

	.index-sidebar {
		width: fit-content;
		display: flex;
		flex-direction: column;
	}

	.index-sidebar-content {
		/* padding: 2px 10px; */
		width: fit-content;
		background: var(--color-back);
		border: 2px solid var(--color-dark);
		white-space: nowrap;
	}

	.animated-java-page-container {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		max-height: 800px;
		overflow-y: auto;
		margin: 0px 0px 0px 20px;
	}
</style>

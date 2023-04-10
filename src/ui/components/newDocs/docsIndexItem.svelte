<script lang="ts" context="module">
	import { type Writable } from 'svelte/store'

	//
</script>

<script lang="ts">
	export let manifest: IDocsManifest
	export let openPageUrl: Writable<string>
	export let myPageUrl: string
	export let myStructure: IDocsManifest['structure']
	let myPage = manifest.pages.find(page => page.url === myPageUrl)!
	if (!myPage) throw new Error(`Failed to find page with URL ${myPageUrl}`)
	let expanded = false

	function toggleExpand() {
		expanded = !expanded
	}

	function onTitleClick() {
		openPageUrl.set(myPageUrl)
	}

	openPageUrl.subscribe(value => {
		if (value === myPageUrl) return (expanded = true)

		function recurse(structure = myStructure): boolean {
			if (Object.keys(structure).includes(value)) return true
			for (const key in structure) {
				if (recurse(structure[key])) return true
			}
			return false
		}

		expanded = recurse(myStructure)
	})

	//
</script>

<li class="index-item">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="title-container"
		style={$openPageUrl === myPageUrl ? 'background: var(--color-button);' : ''}
		on:click={onTitleClick}
	>
		{#if Object.entries(myStructure).length > 0}
			<span class="material-icons" on:click={toggleExpand}>
				{expanded ? 'expand_more' : 'chevron_right'}
			</span>
		{/if}
		<span class="title">{myPage.title}</span>
	</div>
	{#if expanded}
		<ol class="child-container">
			{#each Object.entries(myStructure) as [key, value]}
				<svelte:self {manifest} {openPageUrl} myPageUrl={key} myStructure={value} />
			{/each}
		</ol>
	{/if}
</li>

<style>
	.index-item {
		display: flex;
		flex-direction: column;
		list-style-type: none;
	}

	.title-container {
		display: flex;
		padding: 2px 10px 2px 5px;
	}

	.title {
		text-decoration: underline;
		margin-left: 2px;
	}

	.title-container:hover {
		color: var(--color-light);
		cursor: pointer;
	}

	.child-container {
		display: flex;
		flex-direction: column;
		list-style-type: none;
		margin-left: 20px;
	}
</style>

<script lang="ts">
	import { slide } from '../../util/accessability'

	export let index: any
	export let selectedPage: string
	export let changePage: (page: string) => void
	export let expanded: boolean = false
	export let selected: boolean = false
	export let childSelected: boolean = false

	index.path = index.path || 'index'

	function handleClick(event: any) {
		event.preventDefault()
		// console.log('click', index.path, selectedPage)
		changePage(index.path)
	}

	function toggleExpand(event: any) {
		event.preventDefault()
		expanded = !expanded
	}

	$: selected = selectedPage === index.path
	$: expanded = expanded ? expanded : selected

	$: {
		childSelected = false
		if (index.children) {
			if (Object.values(index.children).find((child: any) => child.path === selectedPage)) {
				childSelected = true
				expanded = true
			}
		}
	}
</script>

<div class="index-container">
	<div class="name-container" style={selected ? 'background-color:var(--color-button)' : ''}>
		{#if index.children && Object.keys(index.children).length}
			<div
				on:click={toggleExpand}
				on:keydown={e => {
					if (e.key === 'Enter') toggleExpand(e)
				}}
				style="display: flex"
			>
				{#if expanded}
					<span
						class="material-icons"
						style="margin:0px; {childSelected || selected
							? 'color:var(--color-subtle_text)'
							: ''}">expand_more</span
					>
				{:else}
					<span class="material-icons" style="margin:0px">chevron_right</span>
				{/if}
			</div>
		{/if}
		<p
			class="name"
			on:click={handleClick}
			on:keypress={e => {
				if (e.key === 'Enter') handleClick(e)
			}}
		>
			{index.name}
		</p>
	</div>
	{#if index.children && Object.keys(index.children).length && expanded}
		<div class="child" transition:$slide={{ duration: 250 }}>
			{#each Object.values(index.children) as localIndex}
				<svelte:self index={localIndex} {changePage} bind:selectedPage />
			{/each}
		</div>
	{/if}
</div>

<style>
	div.index-container {
		/* flex-grow: 1; */
		align-items: flex-start;
		margin-top: 0.25em;
		margin-bottom: 0.25em;
	}

	p.name {
		overflow: hidden;
		word-wrap: none;
		text-decoration: underline;
		padding-left: 0.25em;
		margin: 0px;
		flex-grow: 1;
	}
	p.name:hover {
		cursor: pointer;
		color: var(--color-accent);
	}

	div.name-container {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		padding-left: 0.25em;
	}

	div.child {
		margin-left: 22px;
	}
</style>

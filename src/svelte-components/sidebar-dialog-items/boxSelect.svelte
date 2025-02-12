<script lang="ts">
	import type { Valuable } from '../../util/stores'
	import BaseSidebarDialogItem from './baseSidebarDialogItem.svelte'

	interface ImageItem {
		type: 'image'
		label: string
		src: string
	}
	interface TextItem {
		type: 'text'
		label: string
		description: string
	}

	export let label = ''
	export let description = ''
	export let selected: Valuable<any>
	export let options: Record<any, ImageItem | TextItem>
	export let required = false
</script>

<BaseSidebarDialogItem {label} {required} {description}>
	<div class="options-container">
		{#each Object.entries(options) as [key, option]}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				class="option {key === $selected ? 'option-selected' : ''}"
				on:click={() => {
					$selected = key
				}}
			>
				<p class="option-title">{@html option.label}</p>
				{#if option.type === 'image'}
					<img src={option.src} alt="" />
				{:else}
					<p class="option-description">{@html option.description}</p>
				{/if}
			</div>
		{/each}
	</div>
</BaseSidebarDialogItem>

<style>
	.options-container {
		display: grid;
		gap: 12px;
		grid-template-columns: 1fr 1fr 1fr;
	}
	.option {
		height: 128px;
		background-color: var(--color-back);
		position: relative;
		overflow: hidden;
		outline: 0px;
		outline: 0px solid var(--color-back);
		transition: outline 0.1s cubic-bezier(0.25, 0.68, 0.53, 1.3);
	}
	.option:hover .option-title {
		color: var(--color-light);
	}
	.option-selected {
		outline: 2px solid var(--color-accent);
		/* outline-bottom: 8px solid var(--color-accent); */
	}
	.option-title {
		margin: 0;
		padding: 8px 14px;
		padding-bottom: 0px;
		color: var(--color-text);
		font-size: large;
	}
	.option img {
		width: 110px;
		height: 110px;
		position: absolute;
		right: -14%;
		bottom: -20%;
		transform: rotate(345deg);
		pointer-events: none;
		user-select: none;
		/* prettier-ignore */
		filter:
			drop-shadow(-2px 0px 1px var(--color-dark))
			drop-shadow(2px 0px 1px var(--color-dark))
			drop-shadow(0px -2px 0px var(--color-dark))
			drop-shadow(0px 2px 1px var(--color-dark));
	}
	.option-description {
		font-size: 0.9em;
		padding: 0px 14px;
		color: var(--color-subtle_text);
		max-width: 95%;
	}
</style>

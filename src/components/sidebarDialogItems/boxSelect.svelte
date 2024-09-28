<script lang="ts">
	import { Valuable } from '../../util/stores'
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

	export let label: string
	export let description: string
	export let selected: Valuable<any>
	export let options: Record<any, ImageItem | TextItem>
	export let required: boolean = false
</script>

<BaseSidebarDialogItem {label} {required} {description}>
	<div class="mode-options-container">
		{#each Object.entries(options) as [key, option]}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				class="mode-option {key === $selected ? 'mode-option-selected' : ''}"
				on:click={() => {
					$selected = key
				}}
			>
				<p class="mode-option-title">{@html option.label.replace('\n', '<br/>')}</p>
				{#if option.type === 'image'}
					<img src={option.src} alt="" />
				{:else}
					<p class="mode-option-description">{option.description}</p>
				{/if}
			</div>
		{/each}
	</div>
</BaseSidebarDialogItem>

<style>
	.mode-options-container {
		display: grid;
		gap: 12px;
		grid-template-columns: 1fr 1fr 1fr;
	}
	.mode-option {
		height: 128px;
		background-color: var(--color-back);
		position: relative;
		overflow: hidden;
		border: 0px;
		border: 0px solid var(--color-back);
		transition: border 0.1s cubic-bezier(0.25, 0.68, 0.53, 1.3);
	}
	.mode-option:hover .mode-option-title {
		color: var(--color-light);
	}
	.mode-option-selected {
		border: 2px solid var(--color-accent);
		border-bottom: 8px solid var(--color-accent);
	}
	.mode-option-title {
		margin: 0;
		padding: 8px 14px;
		color: var(--color-text);
		font-size: large;
	}
	.mode-option img {
		width: 110px;
		height: 110px;
		position: absolute;
		right: -14%;
		bottom: -20%;
		transform: rotate(345deg);
		pointer-events: none;
		user-select: none;
	}
	.mode-option-description {
		font-size: 0.9em;
		padding: 0px 14px;
		color: var(--color-subtle_text);
		max-width: 95%;
	}
</style>

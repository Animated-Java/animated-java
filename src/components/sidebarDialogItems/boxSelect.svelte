<script lang="ts">
	import BaseSidebarDialogItem from './baseSidebarDialogItem.svelte'

	export let label: string
	export let description: string
	export let selected: string
	export let options: Record<
		string,
		{
			label: string
			/**
			 * The source of the image to display next to the label.
			 */
			src: string
		}
	>
	export let required: boolean = false
</script>

<BaseSidebarDialogItem {label} {required} {description}>
	<div class="mode-options-container">
		{#each Object.entries(options) as [key, option]}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				class="mode-option {key === selected ? 'mode-option-selected' : ''}"
				on:click={() => {
					selected = key
				}}
			>
				<p>{@html option.label.replace('\n', '<br/>')}</p>
				<img src={option.src} alt="" />
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
		transition: border 0.1s cubic-bezier(0.25, 0.68, 0.53, 1.3);
	}
	.mode-option:hover p {
		color: var(--color-light);
	}
	.mode-option-selected {
		border: 2px solid var(--color-accent);
	}
	.mode-option p {
		margin: 0;
		padding: 8px 14px;
		color: var(--color-text);
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
</style>

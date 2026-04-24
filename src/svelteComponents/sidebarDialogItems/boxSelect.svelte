<script lang="ts" module>
	import BaseSidebarDialogItem from './baseSidebarDialogItem.svelte'
</script>

<script lang="ts">
	interface BoxItems {
		ImageItem: {
			type: 'image'
			label: string
			src: string
		}
		TextItem: {
			type: 'text'
			label: string
			description: string
		}
	}
	type BoxItem = BoxItems[keyof BoxItems]

	interface Props {
		label?: string
		description?: string
		options: Record<string, BoxItem>
		selected: string
	}

	let { label, description, options, selected = $bindable() }: Props = $props()

	function onItemClick(key: string) {
		selected = key
	}
</script>

<BaseSidebarDialogItem {label} {description}>
	{#snippet children()}
		<div class="box-select-container">
			{#each Object.entries(options) as [key, option]}
				<div
					class="box-select-item {selected === key ? 'selected' : ''}"
					onclick={() => onItemClick(key)}
				>
					{#if option.type === 'image'}
						<img src={option.src} alt={option.label} class="box-select-image" />
						<div class="box-select-label">{option.label}</div>
					{:else if option.type === 'text'}
						<div class="box-select-label">{option.label}</div>
						<div class="box-select-description">{@html option.description}</div>
					{/if}
				</div>
			{/each}
		</div>
	{/snippet}
</BaseSidebarDialogItem>

<style>
	.box-select-container {
		display: grid;
		gap: 12px;
		grid-template-columns: 1fr 1fr 1fr;
	}
	.box-select-item {
		height: 128px;
		background-color: var(--color-back);
		position: relative;
		overflow: hidden;
		outline: 0px solid var(--color-back);
		transition: outline 0.1s cubic-bezier(0.25, 0.68, 0.53, 1.3);
	}
	.box-select-item.selected {
		color: var(--color-text);
		outline: 2px solid var(--color-accent);
	}
	.box-select-item:hover {
		color: var(--color-light);
	}
	.box-select-item:hover .box-select-image {
		filter: brightness(1.2);
		transform: translate(-2px, -2px) rotate(345deg);
	}
	.box-select-label {
		margin: 8px 14px;
		font-size: large;
	}
	.box-select-description {
		margin: 0px 14px;
		font-size: small;
		color: var(--color-subtle_text);
	}
	.box-select-image {
		width: 110px;
		position: absolute;
		right: -14%;
		bottom: -20%;
		pointer-events: none;
		user-select: none;
		transform: translate(0px, 0px) rotate(345deg);
		transition: transform 0.1s cubic-bezier(0.25, 0.68, 0.53, 1.3);
	}
</style>

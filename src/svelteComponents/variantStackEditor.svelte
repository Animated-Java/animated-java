<script lang="ts">
	import { localize as translate } from '../util/lang'
	import { Variant } from '../variants'

	interface Props {
		title: string
		/** HTML shown under the title. */
		description?: string
		/** Shown when no Variants are listed. */
		emptyText: string
		/** Variant UUIDs, applied in order. */
		value: string[]
		onchange: (value: string[]) => void
	}

	let { title, description, emptyText, value, onchange }: Props = $props()

	function openAddVariantMenu(event: MouseEvent) {
		const available = Variant.all.filter(variant => !value.includes(variant.uuid))
		if (!available.length) {
			Blockbench.showQuickMessage(translate('variant_stack_editor.all_variants_added'))
			return
		}
		new Menu(
			available.map(variant => ({
				name: variant.displayName,
				icon: 'texture',
				click: () => onchange([...value, variant.uuid]),
			}))
		).open(event)
	}

	function move(index: number, offset: number) {
		const next = [...value]
		const [uuid] = next.splice(index, 1)
		next.splice(index + offset, 0, uuid)
		onchange(next)
	}
</script>

<div class="toolbar">
	<div>{title}</div>
	<div class="spacer"></div>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="tool"
		title={translate('variant_stack_editor.add_variant')}
		onclick={openAddVariantMenu}
	>
		<i class="material-icons icon">add</i>
	</div>
</div>
{#if description}
	<div class="description">{@html description}</div>
{/if}

<ol class="variant-list">
	{#each value as uuid, index (uuid)}
		{@const variant = Variant.getByUUID(uuid)}
		<li class="variant-item">
			<div class="variant-name" class:missing={!variant}>
				{variant?.displayName ?? translate('variant_stack_editor.missing_variant')}
			</div>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<i
				class="material-icons icon tool"
				class:disabled={index === 0}
				title={translate('variant_stack_editor.move_up')}
				onclick={() => index > 0 && move(index, -1)}>arrow_upward</i
			>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<i
				class="material-icons icon tool"
				class:disabled={index === value.length - 1}
				title={translate('variant_stack_editor.move_down')}
				onclick={() => index < value.length - 1 && move(index, 1)}>arrow_downward</i
			>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<i
				class="material-icons icon tool"
				onclick={() => onchange(value.filter(other => other !== uuid))}>delete</i
			>
		</li>
	{:else}
		<div class="empty">{emptyText}</div>
	{/each}
</ol>

<style>
	.toolbar {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin: 8px 16px 8px;
		width: -webkit-fill-available;
	}
	.spacer {
		flex-grow: 1;
	}
	.description {
		font-size: 0.9em;
		color: var(--color-subtle_text);
		margin-top: -6px;
		margin-bottom: 16px;
		max-width: 80%;
		margin-left: calc(16px + 0.75rem);
	}
	.variant-list {
		display: flex;
		flex-direction: column;
		margin: 8px 16px 8px;
		margin-top: -4px;
		padding: 8px;
		gap: 4px;
		background: var(--color-back);
		border-radius: 6px;
	}
	.variant-item {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.variant-name {
		flex-grow: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.missing {
		color: var(--color-subtle_text);
		font-style: italic;
	}
	.disabled {
		opacity: 0.4;
		cursor: default;
	}
	.empty {
		color: var(--color-subtle_text);
		font-style: italic;
		text-align: center;
	}
</style>

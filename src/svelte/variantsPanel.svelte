<script lang="ts" context="module">
	import { translate } from '../util/translation'
	import { flip } from 'svelte/animate'
	import { SHADOW_ITEM_MARKER_PROPERTY_NAME, dndzone } from 'svelte-dnd-action'
	import { Variant } from '../variants'
	import { events } from '../util/events'
	import { openVariantConfigDialog } from '../interface/dialog/variantConfig'
	import { fade } from 'svelte/transition'
	import { cubicIn } from 'svelte/easing'
	import {
		CREATE_VARIANT_ACTION,
		DELETE_VARIANT_ACTION,
		DUPLICATE_VARIANT_ACTION,
		VARIANT_PANEL_CONTEXT_MENU,
	} from '../interface/panel/variants'

	type LocalVariant = { id: number; value: Variant }

	const flipDurationMs = 100
</script>

<script lang="ts">
	let localVariants: (LocalVariant & { [SHADOW_ITEM_MARKER_PROPERTY_NAME]?: boolean })[] = []

	function updateLocalVariants() {
		localVariants = Variant.all.map((v, i) => ({ id: i, value: v }))
	}

	events.CREATE_VARIANT.subscribe(() => {
		updateLocalVariants()
	})

	events.UPDATE_VARIANT.subscribe(() => {
		updateLocalVariants()
	})

	events.DELETE_VARIANT.subscribe(() => {
		updateLocalVariants()
	})

	events.SELECT_PROJECT.subscribe(() => {
		Variant.selectDefault()
		updateLocalVariants()
	})

	events.SELECT_VARIANT.subscribe(() => {
		updateLocalVariants()
	})

	function createVariant(e: Event) {
		CREATE_VARIANT_ACTION.click(e)
	}

	function duplicateVariant(e: Event) {
		DUPLICATE_VARIANT_ACTION.click(e)
	}

	function selectVariant(variant: Variant) {
		variant.select()
		updateLocalVariants()
	}

	function deleteVariant(e: Event) {
		DELETE_VARIANT_ACTION.click(e)
	}

	function handleSort(e: any) {
		localVariants = e.detail.items
	}

	function finalizeSort(e: any) {
		localVariants = e.detail.items
		Variant.all = localVariants.map((item: LocalVariant) => item.value)
	}

	updateLocalVariants()
</script>

<div class="panel_container">
	<div class="toolbar">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="tool"
			title={translate('panel.variants.tool.create_new_variant')}
			on:click={e => createVariant(e)}
		>
			<i class="material-icons icon">texture_add</i>
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="tool"
			title={translate('panel.variants.tool.duplicate_selected_variant')}
			on:click={e => duplicateVariant(e)}
		>
			<i class="material-icons icon">content_copy</i>
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="tool"
			title={translate('panel.variants.tool.delete_selected_variant')}
			on:click={e => deleteVariant(e)}
		>
			<i
				class={'material-icons icon' +
					(Variant.selected?.isDefault ? ' in_list_button_disabled' : '')}
				>delete
			</i>
		</div>
	</div>
	<ul
		class="variants_list"
		use:dndzone={{ items: localVariants, flipDurationMs, dropTargetStyle: {} }}
		on:consider={handleSort}
		on:finalize={finalizeSort}
	>
		{#each localVariants as item (item.id)}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<li
				class={item.value === Variant.selected
					? 'variant_item selected_variant_item'
					: 'variant_item'}
				animate:flip={{ duration: flipDurationMs }}
				on:click={() => selectVariant(item.value)}
				on:contextmenu|stopPropagation={e => {
					item.value.select()
					VARIANT_PANEL_CONTEXT_MENU.open(e)
				}}
			>
				{#if item[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
					<div
						style="visibility: visible !important; position: relative; top: 0; left: 0; border-bottom: 2px solid var(--color-accent); width: 100%; height: 15px;"
						in:fade={{ duration: 150, easing: cubicIn }}
					></div>
				{:else}
					<i class="material-icons icon in_list_button">texture</i>
					<div class="variant_item_name">
						{item.value.displayName}
					</div>
					<div class="spacer" />
					{#if item.value.isDefault}
						<i
							class="material-icons icon in_list_button in_list_button_disabled"
							title={translate('panel.variants.tool.cannot_edit_default_variant')}
							>edit</i
						>
					{:else}
						<i
							class="material-icons icon in_list_button"
							title={translate('panel.variants.tool.edit_variant')}
							on:click={() => openVariantConfigDialog(item.value)}>edit</i
						>
					{/if}
					{#if Variant.selected === item.value}
						<i
							class="material-icons icon in_list_button"
							title={translate('panel.variants.tool.variant_visible')}>visibility</i
						>
					{:else}
						<i
							class="material-icons icon in_list_button in_list_button_disabled"
							title={translate('panel.variants.tool.variant_not_visible')}
						>
							visibility_off
						</i>
					{/if}

					{#if !item.value.isDefault}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<i
							class="material-icons icon in_list_button"
							on:click={e => deleteVariant(e)}
						>
							delete
						</i>
					{:else}
						<i
							class="material-icons icon in_list_button_disabled"
							title={translate('panel.variants.tool.cannot_delete_default_variant')}
						>
							delete
						</i>
					{/if}
				{/if}
			</li>
		{/each}
	</ul>
</div>

<style>
	.panel_container {
		display: flex;
		flex-direction: column;
	}
	.spacer {
		flex-grow: 1;
	}
	.variants_list {
		list-style: none;
		background-color: var(--color-back);
		scroll-behavior: smooth;
		overflow-y: auto;
		max-height: 250px;
	}
	.variant_item {
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		padding: 4px;
		cursor: unset !important;
		min-height: 32px;
		max-height: 32px;
	}
	.variant_item_name {
		margin-left: 8px;
	}
	.variant_item:hover {
		color: var(--color-light);
	}
	.in_list_button_disabled {
		color: var(--color-subtle_text);
	}
	.selected_variant_item {
		background-color: var(--color-selected);
	}
</style>

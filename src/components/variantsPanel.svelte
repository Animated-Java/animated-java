<script lang="ts" context="module">
	import { translate } from '../util/translation'
	import { flip } from 'svelte/animate'
	import { dndzone } from 'svelte-dnd-action'
	import { Variant } from '../variants'
	import { events } from '../util/events'

	const flipDurationMs = 100
</script>

<script lang="ts">
	let localVariants: Variant[] = []

	events.CREATE_VARIANT.subscribe(() => {
		localVariants = Variant.all
	})

	events.DELETE_VARIANT.subscribe(() => {
		localVariants = Variant.all
	})

	function createVariant() {
		new Variant('New Variant')
		console.log(Variant.all.map(v => v.name))
	}

	function selectVariant(variant: Variant) {
		Variant.selected = variant
		localVariants = Variant.all
	}

	function deleteVariant(variant: Variant) {
		variant.delete()
	}

	function handleSort(e: any) {
		Variant.all = e.detail.items
		localVariants = Variant.all
	}
</script>

<div class="panel_container">
	<div class="toolbar">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="tool"
			title={translate('panel.variants.tool.create_new_variant')}
			on:click={() => createVariant()}
		>
			<i class="material-icons icon">texture_add</i>
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="tool"
			title={translate('panel.variants.tool.delete_selected_variant')}
			on:click={() => Variant.selected && deleteVariant(Variant.selected)}
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
		on:finalize={handleSort}
	>
		{#key localVariants}
			{#each localVariants as item (item.id)}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li
					class={item === Variant.selected
						? 'variant_item selected_variant_item'
						: 'variant_item'}
					animate:flip={{ duration: flipDurationMs }}
					on:click={() => selectVariant(item)}
				>
					<i class="material-icons icon in_list_button">texture</i>
					<div class="variant_item_name">
						{item.name}
					</div>
					<div class="spacer" />
					{#if !item.isDefault}
						<i class="material-icons icon in_list_button">edit</i>
					{/if}
					{#if Variant.selected === item}
						<i class="material-icons icon in_list_button">visibility</i>
					{:else}
						<i class="material-icons icon in_list_button in_list_button_disabled"
							>visibility_off</i
						>
					{/if}
					{#if !item.isDefault}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<i
							class="material-icons icon in_list_button"
							on:click={() => deleteVariant(item)}>delete</i
						>
					{/if}
				</li>
			{/each}
		{/key}
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
	}
	.variant_item_name {
		margin-left: 8px;
	}
	.in_list_button_disabled {
		color: var(--color-subtle_text);
	}
	.selected_variant_item {
		background-color: var(--color-selected);
	}
</style>

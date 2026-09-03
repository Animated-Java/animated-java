<script lang="ts" module>
	import { onDestroy } from 'svelte'
	import { VanillaBlockDisplay } from '../../outliner/vanillaBlockDisplay'
	import { type BlockStateValue } from '../../systems/minecraft/blockstateManager'
	import EVENTS from '../../util/events'
	import { localize as translate } from '../../util/lang'
	import { parseBlock, stringifyBlock, validateBlock } from '../../util/minecraftUtil'

	interface BlockStateControl {
		key: string
		options: Record<string, string>
		value: string
	}
</script>

<script lang="ts">
	let selected = $state(VanillaBlockDisplay.selected.at(0))
	let block = $derived(selected?.block)
	let error = $derived(selected?.error)

	let blockId = $state('')
	let blockDefaults = $state<Record<string, BlockStateValue>>({})
	let stateControls = $state<BlockStateControl[]>([])

	const onSelectionChanged = () => {
		selected = VanillaBlockDisplay.selected.at(0)
		block = selected?.block
		error = selected?.error
	}

	const unsubs = [
		EVENTS.UNDO.subscribe(onSelectionChanged),
		EVENTS.REDO.subscribe(onSelectionChanged),
		EVENTS.UPDATE_SELECTION.subscribe(onSelectionChanged),
	]

	$effect(() => {
		const thisSelected = selected
		const thisBlock = block
		error?.set('')
		if (thisSelected && thisBlock && thisSelected.block !== thisBlock) {
			void validateBlock(thisBlock)
				.then(err => {
					if (err) {
						error?.set(err)
						console.log('Block validation error:', err)
						return
					}
					console.log('Changing block to', thisBlock)
					Undo.initEdit({ elements: [thisSelected] })

					thisSelected.block = thisBlock
					Project!.saved = false

					Undo.finishEdit(`Change Block Display Block to "${thisBlock}"`, {
						elements: [thisSelected],
					})
				})
				.catch(err => {
					error?.set(err.message)
				})
		}
	})

	// Keep the blockstate dropdowns in sync with the block string.
	$effect(() => {
		void rebuildStateControls(block)
	})

	async function rebuildStateControls(blockString: string | undefined) {
		const parsed = blockString ? await parseBlock(blockString) : undefined
		const registryEntry = parsed?.blockStateRegistryEntry
		if (!parsed || !registryEntry) {
			blockId = ''
			blockDefaults = {}
			stateControls = []
			return
		}
		blockId = parsed.resourceLocation
		blockDefaults = registryEntry.defaultStates
		stateControls = Object.entries(registryEntry.stateValues).map(([key, values]) => ({
			key,
			options: Object.fromEntries(values.map(v => [String(v), String(v)])),
			value: String(parsed.states[key] ?? registryEntry.defaultStates[key]),
		}))
	}

	function onStateChange(key: string, value: string) {
		const states: Record<string, BlockStateValue> = {}
		for (const control of stateControls) {
			states[control.key] = control.key === key ? value : control.value
		}
		const next = stringifyBlock(blockId, states, blockDefaults)
		if (next !== block) block = next
	}

	const mountStateSelect = (node: HTMLDivElement, control: BlockStateControl) => {
		const select = new Interface.CustomElements.SelectInput(
			`animated_java:block_display_state/${control.key}`,
			{
				options: control.options,
				value: control.value,
				onChange(value) {
					onStateChange(control.key, String(value))
				},
			}
		)
		node.appendChild(select.node)
		return {
			destroy() {
				select.node.remove()
			},
		}
	}

	onDestroy(() => {
		unsubs.forEach(u => u())
	})
</script>

{#if selected}
	<p class="panel_toolbar_label label">
		{translate('panel.vanilla_block_display.title')}
	</p>

	<div
		class="toolbar custom-toolbar"
		title={translate('panel.vanilla_block_display.description')}
	>
		<div class="content" style="width: 95%;">
			<input type="text" bind:value={block} />
		</div>
	</div>

	{#if stateControls.length > 0}
		<p class="panel_toolbar_label label">
			{translate('panel.vanilla_block_display.blockstates')}
		</p>
		<div class="blockstate-list">
			{#each stateControls as control (blockId + '/' + control.key + '=' + control.value)}
				<div class="blockstate-row">
					<span class="blockstate-key" title={control.key}>{capitalizeFirstLetter(control.key)}</span>
					<div class="blockstate-select" use:mountStateSelect={control}></div>
				</div>
			{/each}
		</div>
	{/if}

	{#if $error}
		<div class="error">
			{$error}
		</div>
	{/if}
{/if}

<style>
	input {
		background-color: var(--color-button);
		padding: 2px 8px;
		width: 100%;
	}
	.label {
		margin-bottom: -3px !important;
	}
	.custom-toolbar {
		display: flex;
		flex-direction: row;
		margin-bottom: 1px;
	}
	.custom-toolbar :global(.sp-replacer) {
		padding: 4px 18px !important;
		height: 28px !important;
		margin: 1px 0px !important;
	}
	.blockstate-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 4px 0px;
		width: 95%;
		background: var(--color-back);
		padding: 4px;
		border-radius: 6px;
	}
	.blockstate-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;margin-left: 8px;
	}
	.blockstate-key {
		font-size: 14px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.blockstate-select {
		flex: 0 0 55%;
		display: flex;
	}
	.blockstate-select :global(.bb-select) {
		width: 100%;
	}
	.error {
		margin: 2px 8px;
		font-size: 14px;
		color: var(--color-error);
	}
</style>

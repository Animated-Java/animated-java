<script lang="ts">
	import { BlockDisplay } from '@aj/blockbench-additions/outliner-elements/blockDisplay'
	import { ItemDisplay } from '@aj/blockbench-additions/outliner-elements/itemDisplay'
	import { TextDisplay } from '@aj/blockbench-additions/outliner-elements/textDisplay'
	import EVENTS from '@aj/util/events'
	import TextDisplayPage from './textDisplayPage.svelte'

	// Fix for svelte not recognizing global Blockbench types
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const Group = Blockbench.Group

	let selectedThing: TextDisplay | BlockDisplay | ItemDisplay | Group | undefined

	EVENTS.UPDATE_SELECTION.subscribe(() => {
		if (Group.first_selected) {
			selectedThing = Group.first_selected
		} else if (TextDisplay.selected.length > 0) {
			selectedThing = TextDisplay.selected.at(0)
		} else if (BlockDisplay.selected.length > 0) {
			selectedThing = BlockDisplay.selected.at(0)
		} else if (ItemDisplay.selected.length > 0) {
			selectedThing = ItemDisplay.selected.at(0)
		} else {
			selectedThing = undefined
		}
	})
</script>

{#if selectedThing instanceof Group}
	<div>{selectedThing.name}</div>
{:else if selectedThing instanceof TextDisplay}
	<TextDisplayPage textDisplay={selectedThing} />
{:else if selectedThing instanceof BlockDisplay}
	<div>{selectedThing.name}</div>
{:else if selectedThing instanceof ItemDisplay}
	<div>{selectedThing.name}</div>
{:else}
	<div>Unknown type</div>
{/if}

<style>
</style>

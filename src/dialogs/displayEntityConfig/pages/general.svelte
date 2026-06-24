<script lang="ts">
	import { onDestroy } from 'svelte'
	import CodeEdit from '../../../svelteComponents/sidebarDialogItems/codeEdit.svelte'
	import { localize } from '../../../util/lang'
	import type { DisplayEntity } from '../displayEntityConfig'

	interface Props {
		displayEntity: DisplayEntity
	}

	let { displayEntity }: Props = $props()

	let onSummonFunction = $derived(displayEntity.onSummonFunction ?? '')

	onDestroy(() => {
		console.log('Saving onSummonFunction for displayEntity', onSummonFunction)
		if (displayEntity.onSummonFunction !== onSummonFunction) {
			Project!.saved = false
		}
		displayEntity.onSummonFunction = onSummonFunction
	})
</script>

<CodeEdit
	label={localize('dialog.display_entity.on_summon_function.title')}
	description={localize('dialog.display_entity.on_summon_function.description')}
	syntax="mcfunction"
	bind:value={onSummonFunction}
/>

<script lang="ts">
	import type { Syncable } from '@aj/util/stores'
	import Checkbox from '@components/sidebar-dialog/checkbox.svelte'

	interface Props {
		generalSettings: {
			bool: Syncable<boolean>
		}
	}

	const { generalSettings }: Props = $props()

	// const bool = syncable(false)
	// bool.subscribe(v => console.log('Checkbox value:', v))
</script>

<Checkbox
	label="Test Item"
	description="This is a description"
	required={true}
	value={generalSettings.bool}
/>

<script lang="ts">
	import type { BlueprintSettings } from '../../interface/blueprintSettingsDialog'
	import Checkbox from '../sidebarDialogItems/checkbox.svelte'
	export let settings: BlueprintSettings
</script>

<Checkbox
	label="Use Storage for Animation"
	description="Use command storage instead of functions to encode animations. This will reduce the number of function files created, but is much slower."
	bind:checked={settings.use_storage_for_animation}
/>

<style>
</style>

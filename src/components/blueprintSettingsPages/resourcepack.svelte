<script lang="ts">
	import type { ValuableBlueprintSettings } from '../../interface/blueprintSettingsDialog'
	import BoxSelect from '../sidebarDialogItems/boxSelect.svelte'
	export let settings: ValuableBlueprintSettings
	let resourcePackExportMode = settings.resource_pack_export_mode
</script>

<BoxSelect
	label="Export Mode"
	description="Choose the export format for the generated Resource Pack."
	selected={resourcePackExportMode}
	options={{
		folder: {
			type: 'text',
			label: 'Export to Folder',
			description: 'Export the generated Resource Pack to a folder.',
		},
		zip: {
			type: 'text',
			label: 'Export to Zip',
			description: 'Export the generated Resource Pack to a zip file.',
		},
		none: {
			type: 'text',
			label: 'Do Not Export',
			description: 'Do not export a Resource Pack.',
		},
	}}
/>

<style>
</style>

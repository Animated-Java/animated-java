<script lang="ts">
	import type { ValuableBlueprintSettings } from '../'
	import FileSelect from '../../components/sidebarDialogItems/fileSelect.svelte'
	import { resolvePath } from '../../../util/fileUtil'
	import { translate } from '../../../util/translation'
	export let settings: ValuableBlueprintSettings

	const jsonFileChecker: DialogItemValueChecker<string> = value => {
		let path: string
		try {
			path = resolvePath(value)
		} catch (e) {
			console.error(e)
			return {
				type: 'error',
				message: translate('dialog.blueprint_settings.json_file.error.file_does_not_exist'),
			}
		}
		switch (true) {
			case value === '':
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.json_file.error.no_file_selected',
					),
				}
			case fs.existsSync(path) && !fs.statSync(path).isFile():
				return {
					type: 'error',
					message: translate('dialog.blueprint_settings.json_file.error.not_a_file'),
				}
			default:
				return { type: 'success', message: '' }
		}
	}
</script>

<FileSelect
	label="Export File"
	description="Choose the file to export the blueprint to."
	value={settings.json_file}
	placeholder="Select a File"
	required
	valueChecker={jsonFileChecker}
/>

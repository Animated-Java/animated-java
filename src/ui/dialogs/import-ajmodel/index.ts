import * as modelDataFixerUpper from '@aj/blockbench-additions/model-formats/ajblueprint/dfu'
import { BLUEPRINT_CODEC, type IBlueprintFormatJSON } from '@aj/blueprintFormat'
import { PACKAGE } from '@aj/constants'
import { injectSvelteCompomponent } from '@aj/util/injectSvelteComponent'
import { sanitizePathName } from '@aj/util/minecraftUtil'
import { createModelLoader } from '@aj/util/moddingTools'
import { translate } from '@aj/util/translation'
import { SvelteComponentDev } from 'svelte/internal'
import { openUnexpectedErrorDialog } from '../unexpected-error'
import ImportAjModelLoaderDialog from './importAJModelLoaderDialog.svelte'

let activeComponent: SvelteComponentDev | null = null

createModelLoader(`${PACKAGE.name}-upgradeAJModelLoader`, {
	icon: 'upload_file',
	category: 'animated_java',
	name: translate('action.upgrade_old_aj_model_loader.name'),
	condition() {
		return true
	},
	format_page: {
		component: {
			template: `<div id="${PACKAGE.name}-upgradeAJModelLoader-target" style="flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;"></div>`,
		},
	},
	onFormatPage() {
		if (activeComponent) {
			activeComponent.$destroy()
		}
		void injectSvelteCompomponent({
			component: ImportAjModelLoaderDialog,
			props: {},
			elementSelector() {
				return document.querySelector(`#${PACKAGE.name}-upgradeAJModelLoader-target`)
			},
			postMount(el) {
				activeComponent = el
			},
			injectIndex: 2,
		})
	},
})

export function convertAJModelToBlueprint(path: string) {
	try {
		console.log(`Convert .ajmodel: ${path}`)
		const blueprint = modelDataFixerUpper.process(
			JSON.parse(fs.readFileSync(path, 'utf8'))
		) as IBlueprintFormatJSON

		BLUEPRINT_CODEC.load(blueprint, {
			name: 'Upgrade .ajmodel to Blueprint',
			path,
		})
		// FIXME: This needs to be updated to the new ID system.
		blueprint.blueprint_settings!.id ??= sanitizePathName(Project!.name)

		requestAnimationFrame(() => {
			Project!.save_path = ''
			Project!.export_path = ''
			Project!.openSettings()
		})
	} catch (e) {
		console.error(e)
		openUnexpectedErrorDialog(e as Error)
	}
}

import { SvelteComponentDev } from 'svelte/internal'
import ImportAjModelLoaderDialog from '../components/importAJModelLoaderDialog.svelte'
import { PACKAGE } from '../constants'
import { injectSvelteCompomponent } from '../util/injectSvelte'
import { createModelLoader } from '../util/moddingTools'
import { translate } from '../util/translation'
import { openUnexpectedErrorDialog } from './unexpectedErrorDialog'
import * as ModelDatFixerUpper from '../systems/modelDataFixerUpper'
import { BLUEPRINT_CODEC } from '../blueprintFormat'

let activeComponent: SvelteComponentDev | null = null

createModelLoader(`${PACKAGE.name}-upgradeAJModelLoader`, {
	icon: 'folder_open',
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
		injectSvelteCompomponent({
			svelteComponent: ImportAjModelLoaderDialog,
			svelteComponentProperties: {},
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
		console.log(`Convert Old .ajmodel: ${path}`)
		const blueprint = ModelDatFixerUpper.process(JSON.parse(fs.readFileSync(path, 'utf8')))

		BLUEPRINT_CODEC.load(blueprint, {
			name: 'Upgrade .ajmodel to Blueprint',
			path: undefined,
		})
	} catch (e) {
		console.error(e)
		openUnexpectedErrorDialog(e as Error)
	}
}

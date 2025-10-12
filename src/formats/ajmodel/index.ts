import { registerModelLoader } from 'src/util/moddingTools'
import { mountSvelteComponent } from 'src/util/mountSvelteComponent'
import { openUnexpectedErrorDialog } from '../../interface/dialog/unexpectedError'
import { sanitizeStorageKey } from '../../util/minecraftUtil'
import { translate } from '../../util/translation'
import { BLUEPRINT_CODEC } from '../blueprint/codec'
import * as modelDatFixerUpper from '../blueprint/dfu'
import FormatPage from './formatPage.svelte'

// Blockbench has a bug where it calls the onStart function multiple times when double-clicking it.
let waitingForAJModel = false
export async function openAJModel() {
	if (waitingForAJModel) return
	waitingForAJModel = true
	const result = await electron.dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [{ name: '.ajmodel', extensions: ['ajmodel'] }],
		message: translate('action.upgrade_old_aj_model_loader.select_file'),
	})
	waitingForAJModel = false
	if (result.canceled) return
	convertAJModelToBlueprint(result.filePaths[0])
}

export function convertAJModelToBlueprint(path: string) {
	try {
		console.log(`Converting .ajmodel: ${path}`)
		const blueprint = modelDatFixerUpper.process(JSON.parse(fs.readFileSync(path, 'utf8')))

		const codec = BLUEPRINT_CODEC.get()
		if (!codec) throw new Error('Animated Java Blueprint codec is not registered!')

		codec.load(blueprint, {
			name: 'Upgrade .ajmodel to Blueprint',
			path,
		})
		blueprint.blueprint_settings!.export_namespace ??= sanitizeStorageKey(Project!.name)

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

registerModelLoader(
	{ id: `animated-java:upgrade-aj-model-loader` },
	{
		icon: 'upload_file',
		category: 'animated_java',
		name: translate('action.upgrade_old_aj_model_loader.name'),
		condition: true,
		format_page: {
			component: {
				template: `<div id="animated-java:upgrade-aj-model-loader-target" style="flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;"></div>`,
				mounted() {
					// Don't need to worry about unmounting since the whole panel gets replaced when switching formats
					mountSvelteComponent({
						component: FormatPage,
						target: `#animated-java\\:upgrade-aj-model-loader-target`,
						injectIndex: 2,
					})
				},
			},
		},
		onStart: openAJModel,
	}
)

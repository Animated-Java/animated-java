import { registerModelLoader } from 'src/util/moddingTools'
import { SvelteComponentDev } from 'svelte/internal'
import { BLUEPRINT_CODEC } from '../blueprintFormat'
import ImportAjModelLoaderDialog from '../components/importAJModelLoaderDialog.svelte'
import * as ModelDatFixerUpper from '../systems/modelDataFixerUpper'
import { injectSvelteComponent } from '../util/injectSvelteComponent'
import { sanitizeStorageKey } from '../util/minecraftUtil'
import { translate } from '../util/translation'
import { openUnexpectedErrorDialog } from './dialog/unexpectedError'

let activeComponent: SvelteComponentDev | null = null

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
			},
		},
		onFormatPage() {
			if (activeComponent) {
				activeComponent.$destroy()
			}

			void injectSvelteComponent({
				component: ImportAjModelLoaderDialog,
				props: {},
				elementSelector() {
					return document.querySelector(`#animated-java\\:upgrade-aj-model-loader-target`)
				},
				postMount(el) {
					activeComponent = el
				},
				injectIndex: 2,
			})
		},
	}
)

export function convertAJModelToBlueprint(path: string) {
	try {
		console.log(`Convert .ajmodel: ${path}`)
		const blueprint = ModelDatFixerUpper.process(JSON.parse(fs.readFileSync(path, 'utf8')))

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

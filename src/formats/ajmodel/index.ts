import { registerDeletableHandlerPatch } from 'blockbench-patch-manager'
import { mount, unmount } from 'svelte'
import { getFsModule } from '../../constants'
import { openUnexpectedErrorDialog } from '../../dialogs/unexpectedError/unexpectedError'
import { localize as translate } from '../../util/lang'
import { sanitizeStorageKey } from '../../util/minecraftUtil'
import { BLUEPRINT_CODEC } from '../blueprint/codec'
import { upgradeAnimatedJavaBlueprint } from '../blueprint/dfu'
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
	const { readFileSync } = getFsModule()

	try {
		console.log(`Converting .ajmodel: ${path}`)
		const blueprint = upgradeAnimatedJavaBlueprint(JSON.parse(readFileSync(path, 'utf8')))

		const codec = BLUEPRINT_CODEC.get()
		if (!codec) throw new Error('Animated Java Blueprint codec is not registered!')

		codec.load(blueprint, {
			name: 'Upgrade .ajmodel to Blueprint',
			path,
		})
		blueprint.blueprint_settings!.blueprint_id ??=
			'animated_java:' + sanitizeStorageKey(Project!.name)

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

let mountedComponent: ReturnType<typeof mount> | null = null
let titleElement: HTMLElement | null = null

registerDeletableHandlerPatch({
	id: `animated_java:model-loader/ajmodel`,
	create() {
		return new ModelLoader(`animated_java:model-loader/ajmodel`, {
			icon: 'upload_file',
			category: 'animated_java',
			name: translate('action.upgrade_old_aj_model_loader.name'),
			condition: true,
			format_page: {
				component: {
					template: '<div></div>',
					mounted(this: Vue) {
						const target = this.$el.parentElement!
						titleElement = target.querySelector('h2')
						if (titleElement) titleElement.hidden = true

						mountedComponent = mount(FormatPage, { target })
					},
					destroyed(this: Vue) {
						if (titleElement) titleElement.hidden = false
						if (mountedComponent) {
							void unmount(mountedComponent!)
							mountedComponent = null
						}
					},
				},
			},
			onStart: openAJModel,
		})
	},
})

// import ImportOldAjModelLoaderDialogSvelteComponent from '../components/importOldAJModelLoaderDialog.svelte'
import { PACKAGE } from '../constants'
import { createModelLoader } from '../util/moddingTools'
// import { SvelteDialog } from '../util/svelteDialog'
import { translate } from '../util/translation'

createModelLoader(`${PACKAGE.name}:upgradeOldAJModelLoader`, {
	icon: 'folder_open',
	category: 'animated_java',
	name: translate('action.upgrade_old_aj_model_loader.name'),
	condition() {
		return true
	},
	onStart() {
		void Promise.any([
			// @ts-ignore
			electron.dialog.showOpenDialog({
				properties: ['openFile'],
				filters: [{ name: '.ajmodel', extensions: ['ajmodel'] }],
				message: 'Select the old .ajmodel file to upgrade.',
			}),
		]).then(result => {
			if (!result.canceled) {
				console.log(result)
				convertOldAJModel(result.filePaths[0] as string)
			}
		})
	},
})

function convertOldAJModel(path: string) {
	console.log(`Convert Old .ajmodel: ${path}`)
	// TODO Implement .ajmodel to Blueprint conversion
}

// function openUpgradeOldAJModelLoaderDialog() {
// 	new SvelteDialog({
// 		id: `${PACKAGE.name}:upgradeOldAjModelLoader`,
// 		title: translate('dialog.upgrade_old_aj_model_loader.title'),
// 		width: 512,
// 		svelteComponent: ImportOldAjModelLoaderDialogSvelteComponent,
// 		svelteComponentProperties: {},
// 		preventKeybinds: true,
// 		onConfirm() {
// 			console.log('Upgrade Old Animated Java Model')
// 		},
// 	}).show()
// }

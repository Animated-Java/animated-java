import { ajModelFormat } from '../modelFormat'
import { createAction } from '../util/moddingTools'
import { translate } from '../util/translation'
import { SvelteDialog } from './util/svelteDialog'
import CameraConfigComponent from './components/cameraConfig.svelte'

export function openAJCameraConfigDialog() {
	new SvelteDialog({
		id: 'aj_bone_config',
		title: translate('animated_java.dialog.camera_config'),
		width: 600,
		svelteComponent: CameraConfigComponent,
		svelteComponentProps: { camera: OutlinerElement.types.camera.selected.at(0) },
	}).show()
}

export const CAMERA_CONFIG_ACTION = createAction('animated_java:camera_config', {
	icon: 'settings',
	name: translate('animated_java.menubar.items.camera_config'),
	condition: () => Format === ajModelFormat,
	click: () => {
		openAJCameraConfigDialog()
	},
})

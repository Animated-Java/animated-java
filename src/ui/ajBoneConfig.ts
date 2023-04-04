import { ajModelFormat } from '../modelFormat'
import { createAction } from '../util/moddingTools'
import { translate } from '../util/translation'
import { SvelteDialog } from './util/svelteDialog'
import BoneConfigComponent from './components/boneConfig.svelte'

export function openAJBoneConfigDialog() {
	new SvelteDialog({
		id: 'aj_bone_config',
		title: translate('animated_java.dialog.bone_config'),
		width: 600,
		svelteComponent: BoneConfigComponent,
		svelteComponentProps: { group: Group.selected },
	}).show()
}

export const BONE_CONFIG_ACTION = createAction('animated_java:bone_config', {
	icon: 'settings',
	name: translate('animated_java.menubar.items.bone_config'),
	condition: () => Format === ajModelFormat,
	click: () => {
		openAJBoneConfigDialog()
	},
})

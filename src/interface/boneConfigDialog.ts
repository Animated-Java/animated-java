import { BLUEPRINT_FORMAT } from '../blueprintFormat'
import BoneConfigDialogSvelteComponent from '../components/boneConfigDialog.svelte'
import { PACKAGE } from '../constants'
import { createAction } from '../util/moddingTools'
import { SvelteDialog } from '../util/svelteDialog'
import { translate } from '../util/translation'

export function openBoneConfigDialog(bone: Group) {
	new SvelteDialog({
		id: `${PACKAGE.name}:bone_config`,
		title: translate('dialog.bone_config.title'),
		width: 400,
		svelteComponent: BoneConfigDialogSvelteComponent,
		svelteComponentProperties: { bone },
	}).show()
}

export const BONE_CONFIG_ACTION = createAction(`${PACKAGE.name}:bone_config`, {
	icon: 'settings',
	name: translate('bone_config_action.name'),
	condition: () => Format === BLUEPRINT_FORMAT,
	click: () => {
		openBoneConfigDialog(Group.selected)
	},
})

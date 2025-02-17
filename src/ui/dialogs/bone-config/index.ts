import { CommonDisplayConfig } from '@aj/systems/node-configs'
import { BLUEPRINT_FORMAT } from '../../../blockbench-additions/model-formats/ajblueprint'
import { PACKAGE } from '../../../constants'
import { createAction } from '../../../util/moddingTools'
import { SvelteDialog } from '../../../util/svelteDialog'
import { translate } from '../../../util/translation'
import BoneConfigDialogSvelteComponent from './boneConfig.svelte'

export function openBoneConfigDialog(bone: Group) {
	// Blockbench's JSON stringifier doesn't handle custom toJSON functions, so I'm storing the config JSON in the bone instead of the actual GenericDisplayConfig object
	const boneConfig = new CommonDisplayConfig().fromJSON(bone.configs.default ?? {})

	new SvelteDialog({
		id: `${PACKAGE.name}:boneConfig`,
		title: translate('dialog.bone_config.title'),
		width: 400,
		component: BoneConfigDialogSvelteComponent,
		props: {
			boneConfig,
		},
		preventKeybinds: true,
		onConfirm() {
			bone.configs.default = boneConfig.toJSON()
		},
	}).show()
}

export const BONE_CONFIG_ACTION = createAction(`${PACKAGE.name}:bone_config`, {
	icon: 'settings',
	name: translate('action.open_bone_config.name'),
	condition: () => Format === BLUEPRINT_FORMAT,
	click: () => {
		if (!Group.first_selected) return
		openBoneConfigDialog(Group.first_selected)
	},
})

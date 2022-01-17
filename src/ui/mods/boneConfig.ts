import { CustomAction } from '../../util/customAction'
import { tl } from '../../util/intl'

type AJGroup = {
	nbt: string
	armAnimationEnabled: boolean
} & Group

const openBoneConfig = CustomAction('animatedJava.BoneConfig', {
	name: 'Bone Config',
	icon: 'settings',
	category: 'edit',
	condition: () => true,
	click: function (ev: any) {
		console.log('Opened bone config')
		const selected = Group.selected as AJGroup
		const dialog = new Dialog({
			title: tl('animatedJava.dialogs.boneConfig.title'),
			id: 'boneConfig',
			form: {
				nbt: {
					type: 'textarea',
					label: tl('animatedJava.dialogs.boneConfig.boneNbt'),
					value: selected.nbt,
				},
				// armAnimationEnabled: {
				// 	type: 'checkbox',
				// 	label: tl(
				// 		'animatedJava.boneConfig.armAnimationEnabled'
				// 	),
				// 	value: false,
				// },
			},
			onConfirm: (formData: any) => {
				console.log(formData)
				selected.nbt = formData.nbt
				// selected.armAnimationEnabled = formData.armAnimationEnabled
				dialog.hide()
			},
		}).show()
		// @ts-ignore
		document.querySelector('#nbt').value = selected.nbt
		// console.log(selected.armAnimationEnabled)
		// TODO Add armor_stand arm animation
		// @ts-ignore
		// document.querySelector('#armAnimationEnabled').checked =
		// 	selected.armAnimationEnabled
		selected.armAnimationEnabled = false
	},
})

new Property(Group, 'string', 'nbt', {
	default: () => '{}',
	exposed: true,
})

new Property(Group, 'string', 'armAnimationEnabled', {
	default: () => false,
	exposed: true,
})

// @ts-ignore
Group.prototype.menu.structure.splice(3, 0, openBoneConfig)
// @ts-ignore
openBoneConfig.menus.push({ menu: Group.prototype.menu, path: '' })

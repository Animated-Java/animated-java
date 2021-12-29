import { action, translate } from '../../util'

type AJGroup = {
	nbt: string
	armAnimationEnabled: boolean
} & Group

const openBoneConfig = action({
	id: 'animatedJava.BoneConfig',
	name: 'Bone Config',
	icon: 'settings',
	category: 'edit',
	condition: () => true,
	click: function (ev: any) {
		console.log('Opened bone config')
		const selected = Group.selected as AJGroup
		const dialog = new Dialog({
			title: translate('animatedJava.boneConfig.title'),
			id: 'boneConfig',
			form: {
				nbt: {
					type: 'textarea',
					label: translate('animatedJava.boneConfig.boneNbt'),
					value: selected.nbt,
				},
				armAnimationEnabled: {
					type: 'checkbox',
					label: translate(
						'animatedJava.boneConfig.armAnimationEnabled'
					),
					value: false,
				},
			},
			onConfirm: (formData: any) => {
				console.log(formData)
				selected.nbt = formData.nbt
				selected.armAnimationEnabled = formData.armAnimationEnabled
				dialog.hide()
			},
		}).show()
		// @ts-ignore
		document.querySelector('#nbt').value = selected.nbt
		// console.log(selected.armAnimationEnabled)
		// @ts-ignore
		document.querySelector('#armAnimationEnabled').checked =
			selected.armAnimationEnabled
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

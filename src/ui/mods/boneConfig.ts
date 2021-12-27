import { action, translate } from '../../util'

type AJGroup = {
	nbt: string
	can_manipulate_arms: boolean
} & Group

const open_bone_config = action({
	id: 'animated_java_bone_config',
	name: 'Bone Config',
	icon: 'settings',
	category: 'edit',
	condition: () => true,
	click: function (ev: any) {
		console.log('Opened bone config')
		const selected = Group.selected as AJGroup
		const dialog = new Dialog({
			title: translate('animatedJava.bone_config.title'),
			id: 'bone_config',
			form: {
				nbt: {
					type: 'text',
					label: translate('animatedJava.bone_config.bone_nbt'),
					value: '',
				},
				can_manipulate_arms: {
					type: 'checkbox',
					label: translate(
						'animated_java.bone_config.can_manipulate_arms'
					),
					value: false,
				},
			},
			onConfirm: (form_data: any) => {
				console.log(form_data)
				selected.nbt = form_data.nbt
				selected.can_manipulate_arms = form_data.can_manipulate_arms
				dialog.hide()
			},
		}).show()
		// @ts-ignore
		document.querySelector('#nbt').value = selected.nbt
		// console.log(selected.can_manipulate_arms)
		// @ts-ignore
		document.querySelector('#can_manipulate_arms').checked =
			selected.can_manipulate_arms
	},
})

new Property(Group, 'string', 'nbt', {
	default: () => '{}',
	exposed: true,
})

new Property(Group, 'string', 'can_manipulate_arms', {
	default: () => false,
	exposed: true,
})

// @ts-ignore
Group.prototype.menu.structure.splice(3, 0, open_bone_config)
// @ts-ignore
open_bone_config.menus.push({ menu: Group.prototype.menu, path: '' })

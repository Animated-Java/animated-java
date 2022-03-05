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
			// @ts-ignore
			width: 650,
			component: {
				// @ts-ignore
				components: { VuePrismEditor },
				data: {
					nbt: selected.nbt,
				},
				methods: {},
				template: `
					<div>
						<h3>${tl('animatedJava.dialogs.boneConfig.boneNbt')}</h3>
						<vue-prism-editor id="code-view-output" v-model="nbt" language="snbt" style="height: 10em;" :line-numbers="true" />
					</div>
				`,
			},
			onConfirm() {
				debugger
				selected.nbt = this.component.data.nbt
			},
		}).show()
		// //@ts-ignore
		// dialog.object.children[1].children[1].remove()
		// //@ts-ignore
		// const mount = dialog.object.children[1].children[0]
		// console.log(mount)
		// // @ts-ignore
		// document.querySelector('#nbt').value = selected.nbt
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
;(function (Prism) {
	Prism.languages.snbt = {
		boolean: /\b(?:true|false)\b/,
		number: /-?\d+\.?\d*(e[+-]?\d+[IiBbFfSs]*)?/i,
		operator: /:/,
		property: { pattern: /(?:\\.|[^\{\\"\r\n])*(?=\s*:)/g, greedy: true },
		punctuation: /[{}[\],]/,
		string: { pattern: /"(?:\\.|[^\\"\r\n])*"(?!\s*:)/g, greedy: true },
	}
})(globalThis.Prism)

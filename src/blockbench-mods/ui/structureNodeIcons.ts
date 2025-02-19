import { PACKAGE } from '@aj/constants'
import { createBlockbenchMod } from '@aj/util/moddingTools'
import { translate } from '@aj/util/translation'

createBlockbenchMod(
	`${PACKAGE.name}:structureNodeIcons`,
	{
		// @ts-expect-error
		originalIcon: Group.prototype.icon,
		// @ts-expect-error
		originalTitle: Group.prototype.title,
	},
	ctx => {
		Object.defineProperty(Group.prototype, 'icon', {
			get() {
				for (const child of this.children) {
					if (child instanceof Cube) {
						return ctx.originalIcon
					}
				}
				return 'account_tree'
			},
			set() {
				console.warn('Setting the default Group icon is not allowed!')
			},
		})

		Object.defineProperty(Group.prototype, 'title', {
			get() {
				for (const child of this.children) {
					if (child instanceof Cube) {
						return ctx.originalTitle
					}
				}
				return translate('node.structure.title').replaceAll('<br/>', '\n')
			},
			set() {
				console.warn('Setting the default Group icon is not allowed!')
			},
		})

		return ctx
	},
	ctx => {
		Object.defineProperty(Group.prototype, 'icon', {
			value: ctx.originalIcon,
			get: undefined,
			set: undefined,
		})
		Object.defineProperty(Group.prototype, 'title', {
			value: ctx.originalTitle,
			get: undefined,
			set: undefined,
		})
	}
)

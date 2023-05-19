import type { SvelteComponent } from 'svelte'
import * as PACKAGE from '../../../package.json'

const DIALOG_STACK: SvelteDialog[] = []

export class SvelteDialog extends Dialog {
	instance?: SvelteComponent | undefined
	constructor(
		options: DialogOptions & {
			id: string
			// @ts-ignore
			svelteComponent: SvelteComponentConstructor<SvelteComponent, any>
			svelteComponentProps: Record<string, any>
			lines?: never
			onClose?: () => void
			stackable?: boolean
		}
	) {
		const mount = document.createComment(`${PACKAGE.name}-svelte-dialog-` + guid())

		super(options.id, {
			...options,
			lines: [mount],
		})

		this.onOpen = () => {
			const parentElement = mount.parentElement
			if (this.instance || !parentElement) return
			parentElement.style.overflow = 'visible'
			this.instance = new options.svelteComponent({
				target: parentElement,
				props: options.svelteComponentProps,
			})
			if (super.onOpen) super.onOpen()
			if (!options.stackable) {
				DIALOG_STACK.forEach(v => v.cancel())
				DIALOG_STACK.empty()
			}
			DIALOG_STACK.push(this)
		}

		this.onButton = (...args) => {
			if (!this.instance) return
			// console.log('onButton')
			if (super.onButton) super.onButton(...args)
			if (options.onClose) options.onClose()
			this.instance.$destroy()
			this.instance = undefined
		}

		this.onCancel = (...args) => {
			if (!this.instance) return
			// console.log('onCancel')
			if (super.onCancel) super.onCancel(...args)
			if (options.onClose) options.onClose()
			this.instance.$destroy()
			this.instance = undefined
		}
	}
}

import type { SvelteComponent } from 'svelte'
import * as PACKAGE from '../../package.json'

export class SvelteDialog extends Dialog {
	instance?: SvelteComponent | undefined
	constructor(
		options: DialogOptions & {
			id: string
			// @ts-ignore
			svelteComponent: SvelteComponentConstructor<SvelteComponent, any>
			svelteComponentProps: Record<string, any>
			lines?: never
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
		}

		this.onButton = (...args) => {
			if (!this.instance) return
			this.instance.$destroy()
			this.instance = undefined
			if (super.onButton) super.onButton(...args)
		}
	}
}

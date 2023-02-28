import { SvelteComponent } from 'svelte'

export class AJPanel extends Blockbench.Panel {
	instance?: SvelteComponent
	constructor(
		// @ts-ignore
		svelteComponent: SvelteComponentConstructor<
			unknown,
			// @ts-ignore
			Svelte2TsxComponentConstructorParameters<any>
		>,
		svelteComponentArgs: Record<string, any>,
		options: PanelOptions & { component: null }
	) {
		const panelId = options.id.replace(/:/g, '-')
		super({
			...options,
			component: {
				name: options.id,
				template: `<div id="${panelId}"></div>`,
			},
		})

		new Promise<Element>(resolve => {
			const id = setInterval(() => {
				let el
				if ((el = document.querySelector(`#${panelId}`))) {
					clearInterval(id)
					resolve(el)
				}
			}, 100)
		}).then(el => {
			console.log('el', el)
			this.instance = new svelteComponent({
				target: el.parentElement as any,
				props: {
					...svelteComponentArgs,
				},
			}) as any
		})
	}
}

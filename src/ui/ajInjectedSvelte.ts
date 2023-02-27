import { SvelteComponent } from 'svelte'

export class AJInjectedSvelteComponent {
	instance?: SvelteComponent
	constructor(
		// @ts-ignore
		svelteComponent: SvelteComponentConstructor<
			unknown,
			// @ts-ignore
			Svelte2TsxComponentConstructorParameters<any>
		>,
		svelteComponentArgs: Record<string, any>,
		elementResolver: () => Element | undefined | null
	) {
		new Promise<Element>(resolve => {
			const id = setInterval(() => {
				const el = elementResolver()
				if (!el) return
				clearInterval(id)
				resolve(el)
			}, 500)
		}).then(el => {
			console.log('el', el)
			this.instance = new svelteComponent({
				target: el.parentElement as any,
				props: {
					...svelteComponentArgs,
				},
			})
		})
	}
}

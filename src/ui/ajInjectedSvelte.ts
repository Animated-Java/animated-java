import { SvelteComponent } from 'svelte'
import { awaitResolve } from '../util/misc'

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
		options: {
			elementSelector: () => Element | undefined | null
			postMount?: (el: Element) => void
		}
	) {
		awaitResolve(options.elementSelector).then(el => {
			console.log('el', el)
			this.instance = new svelteComponent({
				target: el.parentElement as any,
				props: {
					...svelteComponentArgs,
				},
			})
			if (options.postMount) options.postMount(el)
		})
	}
}

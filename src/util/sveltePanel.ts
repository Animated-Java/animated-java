import { type ComponentConstructorOptions, SvelteComponent } from 'svelte'
import PACKAGE from '../../package.json'
import { pollPromise } from '../util/promises'
import { type SvelteComponentConstructor } from './misc'

type SveltePanelOptions<T, U extends ComponentConstructorOptions> = Omit<
	PanelOptions,
	'component'
> & {
	id: string
	component: SvelteComponentConstructor<T, U>
	props: Record<string, any>
}

export class SveltePanel extends Panel {
	instance?: SvelteComponent | undefined
	constructor(options: SveltePanelOptions<any, any>) {
		const mountId = `${PACKAGE.name}-svelte-panel-` + guid()

		super(options.id, {
			...options,
			component: {
				name: options.id,
				template: `<div id="${mountId}"></div>`,
			},
		})

		void pollPromise(() => document.querySelector(`#${mountId}`)).then(el => {
			this.instance = new options.component({
				target: el,
				props: options.props,
			})
		})
	}
}

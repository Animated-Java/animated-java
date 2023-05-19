import { SvelteComponent } from 'svelte'
import * as PACKAGE from '../../../package.json'
import { pollPromise } from '../../util/misc'

export class SveltePanel extends Panel {
	instance?: SvelteComponent | undefined
	constructor(
		options: PanelOptions & {
			id: string
			// @ts-ignore
			svelteComponent: SvelteComponentConstructor<SvelteComponent, any>
			svelteComponentProps: Record<string, any>
			component?: never
		}
	) {
		const mountId = `${PACKAGE.name}-svelte-panel-` + guid()

		super(options.id, {
			...options,
			component: {
				name: options.id,
				template: `<div id="${mountId}"></div>`,
			},
		})

		void pollPromise(() => document.querySelector(`#${mountId}`)).then(el => {
			this.instance = new options.svelteComponent({
				target: el as any,
				props: options.svelteComponentProps,
			})
		})
	}
}

import { awaitResult } from '@aj/util/promises'
import type { ValidateResourceLocation } from '@aj/util/resourceLocation'
import { mount } from 'svelte'
import type { ComponentMountOptions, GenericComponent } from './helperTypes'

type SveltePanelOptions<ID extends string, C extends GenericComponent> = {
	id: ValidateResourceLocation<ID>
} & Omit<PanelOptions, 'component'> &
	Omit<ComponentMountOptions<C>, 'outro'>

export class SveltePanel<ID extends string, C extends GenericComponent> extends Panel {
	instance?: ReturnType<typeof mount> | undefined

	constructor(options: SveltePanelOptions<ID, C>) {
		const mountId = `svelte-panel-` + options.id

		super(options.id, {
			...options,
			component: {
				name: options.id,
				template: `<div id="${mountId}"></div>`,
			},
		})

		void awaitResult(() => document.querySelector(`#${mountId}`)).then(el => {
			this.instance = mount(options.component, {
				target: el!,
				props: options.props,
				intro: options.intro,
				context: options.context,
			})
		})
	}
}

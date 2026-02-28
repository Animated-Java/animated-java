import type { Component, ComponentProps, MountOptions } from 'svelte'

export type GenericComponent = Component<any, any>
export type ComponentPropsPatch<C extends GenericComponent | __sveltets_2_IsomorphicComponent> =
	C extends __sveltets_2_IsomorphicComponent<infer P> ? P : ComponentProps<C>

export interface ComponentMountOptions<C extends GenericComponent> {
	component: C
	props?: ComponentPropsPatch<C>
	intro?: boolean
	outro?: boolean
	/** Can be accessed via getContext() at the component level */
	context?: MountOptions['context']
}

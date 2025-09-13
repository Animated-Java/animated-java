import type { Component, ComponentProps } from 'svelte'

export type GenericComponent = Component<any, any>
export type ComponentPropsPatch<C extends GenericComponent | __sveltets_2_IsomorphicComponent> =
	C extends __sveltets_2_IsomorphicComponent<infer P> ? P : ComponentProps<C>

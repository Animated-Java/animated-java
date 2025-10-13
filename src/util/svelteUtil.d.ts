import type { ComponentProps, ComponentType, SvelteComponent } from 'svelte'

export type SvelteComponentOptions<T extends SvelteComponent> = ComponentProps<T> extends Record<
	string,
	never
>
	? {
			component: ComponentType<T>
			props?: ComponentProps<T>
	  }
	: {
			component: ComponentType<T>
			props: ComponentProps<T>
	  }

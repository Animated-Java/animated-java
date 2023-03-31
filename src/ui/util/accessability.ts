import {
	fade as svelteFade,
	fly as svelteFly,
	slide as svelteSlide,
	scale as svelteScale,
	blur as svelteBlur,
	// crossfade as svelteCrossfade,
	TransitionConfig,
} from 'svelte/transition'
import { derived, readable, Writable, writable } from 'svelte/store'

export const reducedMotion = writable(false)

type TransitionFunction = (node: Element, ...args: any[]) => TransitionConfig
const instant = (node: Element) => svelteFade(node, { duration: 0 })

function reducedMotionTransitionFactory(transition: TransitionFunction) {
	return derived<Writable<boolean>, TransitionFunction>(reducedMotion, ($reducedMotion, set) => {
		set($reducedMotion ? instant : transition)
	})
}

export const fade = readable(svelteFade) // reducedMotionTransitionFactory(svelteFade)
export const fly = reducedMotionTransitionFactory(svelteFly)
export const slide = reducedMotionTransitionFactory(svelteSlide)
export const scale = reducedMotionTransitionFactory(svelteScale)
export const blur = readable(svelteBlur) // reducedMotionTransitionFactory(svelteBlur)
// export const crossfade = reducedMotionTransitionFactory(svelteCrossfade)

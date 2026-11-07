import { registerPatch } from 'blockbench-patch-manager'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint'
import { getKeyframeRepeatSchedule, getKeyframeTick, TICK_RATE } from '../systems/repeatSchedule'

/** Blockbench's sound waveform, drawn inside each channel row keyframe. */
const TEMPLATE_ANCHOR = '<svg class="keyframe_waveform"'
const BAR_TEMPLATE = `<template v-for="bar in [ajRepeatBar(keyframe, size)]"><svg
	v-if="bar"
	class="aj_repeat_bar"
	:width="bar.width"
	height="23"
><line class="aj_repeat_line" x1="0" :x2="bar.width" y1="18" y2="18"></line><line
	v-for="x in bar.marks"
	class="aj_repeat_mark"
	:x1="x"
	:x2="x"
	y1="15"
	y2="21"
></line><line
	v-if="bar.cut"
	class="aj_repeat_cut"
	:x1="bar.width"
	:x2="bar.width"
	y1="5"
	y2="23"
></line></svg></template>`
/** Center of a 13.5px keyframe, where its time sits. */
const KEYFRAME_CENTER = 6.75
/** Keeps a cutoff stop clear of the next keyframe's icon. */
const CUTOFF_GAP = 7
const CSS = `
#panel_timeline .keyframe .aj_repeat_bar {
	position: absolute;
	top: 0;
	left: ${KEYFRAME_CENTER}px;
	overflow: visible;
	pointer-events: none;
}
.aj_repeat_bar .aj_repeat_line,
.aj_repeat_bar .aj_repeat_mark {
	stroke: var(--color-accent);
	stroke-width: 2;
}
.aj_repeat_bar .aj_repeat_line {
	opacity: 0.5;
}
.aj_repeat_bar .aj_repeat_cut {
	stroke: var(--color-warning);
	stroke-width: 3;
}
`
const REFRESH_EVENTS = ['finish_edit', 'undo', 'redo'] as const

/** Swaps a Vue 2 instance's render functions, dropping static trees cached from the old ones. */
function setRender(
	vue: Vue,
	render: Vue['$options']['render'],
	staticRenderFns: Vue['$options']['staticRenderFns']
) {
	vue.$options.render = render
	vue.$options.staticRenderFns = staticRenderFns
	;(vue as unknown as { _staticTrees: unknown })._staticTrees = null
	vue.$forceUpdate()
}

interface IRepeatBar {
	width: number
	/** Whether the next keyframe cuts the repeats short, drawn as a stop at the end. */
	cut: boolean
	/** X of each repeat after the keyframe's own run. */
	marks: number[]
}

/** The repeat bar to draw on a function keyframe, at `size` pixels per second. */
function getRepeatBar(keyframe: _Keyframe, size: number): IRepeatBar | null {
	if (!activeProjectIsBlueprintFormat() || keyframe.channel !== 'function') return null
	if (!keyframe.repeat || !keyframe.animator?.animation) return null
	const schedule = getKeyframeRepeatSchedule(keyframe)
	const start = getKeyframeTick(keyframe)
	const toX = (tick: number) => ((tick - start) / TICK_RATE) * size
	if (schedule.until <= start) return null
	const cut = schedule.cutoff !== undefined
	return {
		width: cut ? Math.max(0, toX(schedule.until) - CUTOFF_GAP) : toX(schedule.until),
		cut,
		marks: schedule.ticks.slice(1).map(toX),
	}
}

registerPatch({
	id: 'animated_java:timeline/repeat-bar',

	apply: () => {
		const vue = Timeline.vue
		const template = vue.$options.template
		if (typeof template !== 'string' || !template.includes(TEMPLATE_ANCHOR)) {
			console.warn(
				'Animated Java: timeline template changed, so repeating function keyframes have no repeat bar.'
			)
			return undefined
		}

		const { render, staticRenderFns } = vue.$options
		const compiled = Vue.compile(
			template.replace(TEMPLATE_ANCHOR, BAR_TEMPLATE + TEMPLATE_ANCHOR)
		)
		Object.assign(vue, { ajRepeatBar: getRepeatBar })
		setRender(vue, compiled.render, compiled.staticRenderFns)

		// Neighbors moving, undo, and animation length changes aren't tracked by Vue.
		const refresh = () => vue.$forceUpdate()
		for (const event of REFRESH_EVENTS) Blockbench.on(event, refresh)
		const css = Blockbench.addCSS(CSS)

		return { vue, render, staticRenderFns, refresh, css }
	},

	revert: patched => {
		if (!patched) return
		const { vue, render, staticRenderFns, refresh, css } = patched
		for (const event of REFRESH_EVENTS) Blockbench.removeListener(event, refresh)
		css.delete()
		setRender(vue, render, staticRenderFns)
		delete (vue as unknown as Record<string, unknown>).ajRepeatBar
	},
})

/**
 * Paint mode for Permutation Sets: painting a recolor paints its base in key colors, the color
 * picker reads what's shown, recolors update during a stroke, and the Color panel gets a strip of
 * the set's colors with a colorway preview.
 */
import {
	registerPatch,
	registerProjectPatch,
	registerPropertyOverridePatch,
} from 'blockbench-patch-manager'
import { mount, unmount } from 'svelte'
import { isEnabled, isEnabledFor, translate } from './host'
import PaintStrip from './paintStrip.svelte'
import {
	clearColorwayPreviews,
	followTexture,
	getSetOfBase,
	getShownTexture,
	getStripColorsNow,
	getStripPermutation,
	PAINT_CONTEXT,
	refreshPaintContext,
} from './paintState'
import { redrawRecolorsOf } from './preview'
import { mapToKey, type PaletteColors } from './recolor'
import { getGeneratedSource, getPaintTarget, isGeneratedTexture } from './sets'

declare global {
	interface BlockbenchEventMap {
		/** Fired by Blockbench's Painter on every edit, including each step of a stroke. */
		edit_texture: { texture: Texture }
	}
}

/** Tools whose strokes paint the brush color, so it gets mapped to the key. */
const COLOR_TOOLS = ['brush_tool', 'fill_tool', 'draw_shape_tool', 'gradient_tool']

/** The texture on the face a 3D view stroke started on, while that stroke starts. */
let canvasFace: Texture | undefined

interface IStroke {
	key: PaletteColors
	/** The palette of the colorway being painted. Unset when painting a base directly. */
	palette?: PaletteColors
	/** Whether this stroke already warned about a color outside the palette. */
	warned: boolean
}

/** Set while a stroke paints a project set's base, so its colors map to the key. */
let stroke: IStroke | undefined

function startStroke(texture: Texture) {
	stroke = undefined
	if (!COLOR_TOOLS.includes(Toolbox.selected?.id)) return
	const set = getSetOfBase(texture)
	if (!set) return
	const data = set.palette_set
	const key = getStripColorsNow(data, data.key)
	if (!key) return
	// A 3D view stroke paints the colorway on its face; a UV editor stroke, the strip's.
	const source = canvasFace && getGeneratedSource(getShownTexture(canvasFace))
	const permutationUuid =
		source?.set === set
			? source.permutation.uuid
			: canvasFace
				? undefined
				: getStripPermutation()
	const permutation = data.permutations.find(p => p.uuid === permutationUuid)
	const palette = permutation && getStripColorsNow(data, permutation.strip)
	stroke = { key, palette, warned: false }
}

registerPropertyOverridePatch({
	id: 'animated_java:palettes/painter-target',
	target: Painter as typeof Painter & { getTextureToEdit(texture: Texture): Texture },
	key: 'getTextureToEdit',
	condition: () => isEnabled(),
	get: original => {
		return function (this: typeof Painter, texture: Texture) {
			return original.call(this, getPaintTarget(texture))
		}
	},
})

/**
 * Whether a paint stroke on `texture` must be stopped: a reference set's recolors are redrawn from
 * the pack, so paint on them would be lost. Picking colors from them is fine.
 */
function blocksPainting(texture: Texture | undefined | null | false): boolean {
	if (!isGeneratedTexture(texture) || Toolbox.selected?.id === 'color_picker') return false
	if (getPaintTarget(texture) !== texture) return false
	Blockbench.showQuickMessage(translate('paint_reference'), 3000)
	return true
}

registerPropertyOverridePatch({
	id: 'animated_java:palettes/paint-canvas-stroke',
	target: Painter as typeof Painter & { startPaintToolCanvas(data: any, event: Event): unknown },
	key: 'startPaintToolCanvas',
	condition: () => isEnabled(),
	get: original => {
		return function (this: typeof Painter, data: any, event: Event) {
			const face = data?.element?.faces?.[data.face] as CubeFace | undefined
			const texture = face?.getTexture() as Texture | undefined
			if (blocksPainting(texture)) return
			if (texture) followTexture(texture)
			canvasFace = texture
			try {
				return original.call(this, data, event)
			} finally {
				canvasFace = undefined
			}
		}
	},
})

registerPropertyOverridePatch({
	id: 'animated_java:palettes/block-reference-paint-uv',
	target: UVEditor as typeof UVEditor & { startPaintTool(event: Event): unknown },
	key: 'startPaintTool',
	condition: () => isEnabled(),
	get: original => {
		return function (this: typeof UVEditor, event: Event) {
			if (blocksPainting(UVEditor.getTexture() as Texture | undefined)) return
			return original.call(this, event)
		}
	},
})

registerPropertyOverridePatch({
	id: 'animated_java:palettes/paint-stroke-start',
	target: Painter as typeof Painter & {
		startPaintTool(texture: Texture, ...args: any[]): unknown
	},
	key: 'startPaintTool',
	condition: () => isEnabled(),
	get: original => {
		return function (this: typeof Painter, texture: Texture, ...args: any[]) {
			startStroke(texture)
			return original.call(this, texture, ...args)
		}
	},
})

registerPropertyOverridePatch({
	id: 'animated_java:palettes/paint-stroke-end',
	target: Painter as typeof Painter & { stopPaintTool(): unknown },
	key: 'stopPaintTool',
	condition: () => isEnabled(),
	get: original => {
		return function (this: typeof Painter) {
			try {
				return original.call(this)
			} finally {
				stroke = undefined
			}
		}
	},
})

// Every paint tool reads the brush color from here, so this is where it's mapped to the key.
registerPropertyOverridePatch({
	id: 'animated_java:palettes/paint-color-mapping',
	target: ColorPanel as typeof ColorPanel & { get(secondary?: boolean): string },
	key: 'get',
	condition: () => isEnabled(),
	get: original => {
		return function (this: typeof ColorPanel, secondary?: boolean) {
			const color = original.call(this, secondary)
			if (!stroke) return color
			const mapped = mapToKey(color, stroke.key, stroke.palette)
			if (!mapped.inKey && !stroke.warned) {
				stroke.warned = true
				Blockbench.showQuickMessage(translate('paint_off_palette', color), 3000)
			}
			return mapped.color
		}
	},
})

// Painting a recolor edits its base, but picking a color should read what the face shows.
registerPropertyOverridePatch({
	id: 'animated_java:palettes/paint-color-picker',
	target: Painter as typeof Painter & {
		colorPicker(texture: Texture, x: number, y: number, event?: Event): unknown
	},
	key: 'colorPicker',
	condition: () => isEnabled(),
	get: original => {
		return function (
			this: typeof Painter,
			texture: Texture,
			x: number,
			y: number,
			event?: Event
		) {
			const shown = canvasFace && isGeneratedTexture(canvasFace)
			return original.call(this, shown ? getShownTexture(canvasFace!) : texture, x, y, event)
		}
	},
})

// A previewed colorway swaps which recolor's material a face draws with.
registerPropertyOverridePatch({
	id: 'animated_java:palettes/colorway-preview',
	target: Texture.prototype,
	key: 'getMaterial',
	condition: () => isEnabled(),
	get: original => {
		return function (this: Texture) {
			return original.call(getShownTexture(this))
		}
	},
})

// The UV editor paints the texture it shows, so show a project recolor's base, which is what
// painting the recolor edits.
registerPatch({
	id: 'animated_java:palettes/uv-editor-base',

	apply: () => {
		const vue = UVEditor.vue as unknown as { texture: Texture | null; updateTexture(): void }
		const original = vue.updateTexture
		vue.updateTexture = function (this: typeof vue) {
			original.call(this)
			if (!isEnabled() || !this.texture) return
			followTexture(this.texture)
			const target = getPaintTarget(this.texture)
			if (target !== this.texture) this.texture = target
		}
		return { vue, original }
	},

	revert: ({ vue, original }) => {
		vue.updateTexture = original
	},
})

registerPatch({
	id: 'animated_java:palettes/paint-strip',

	apply: () => {
		const target = document.createElement('div')
		document.getElementById('color_panel_wrapper')?.before(target)
		const component = mount(PaintStrip, { target })
		return { target, component }
	},

	revert: ({ target, component }) => {
		void unmount(component)
		target.remove()
	},
})

// Keeps paint mode in step with edits: recolors redraw during strokes, and previews end with it.
registerProjectPatch({
	id: 'animated_java:palettes/paint-mode',

	condition: ({ project }) => isEnabledFor(project),
	// Previews and the paint context belong to one project.
	alwaysRevertOnProjectChange: true,

	apply() {
		const bases = new Set<Texture>()
		let frame: number | undefined
		const onEditTexture = ({ texture }: { texture: Texture }) => {
			if (!getSetOfBase(texture)) return
			bases.add(texture)
			frame ??= requestAnimationFrame(() => {
				frame = undefined
				for (const base of bases) void redrawRecolorsOf(base)
				bases.clear()
			})
		}
		const onEdit = () => refreshPaintContext()
		const onSelectMode = ({ mode }: { mode: Mode }) => {
			if (mode.id !== 'paint') clearColorwayPreviews()
		}
		Blockbench.on('edit_texture', onEditTexture)
		Blockbench.on('finish_edit', onEdit)
		Blockbench.on('undo', onEdit)
		Blockbench.on('redo', onEdit)
		Blockbench.on('select_mode', onSelectMode)
		return {
			onEditTexture,
			onEdit,
			onSelectMode,
			cancel: () => frame && cancelAnimationFrame(frame),
		}
	},

	revert({ onEditTexture, onEdit, onSelectMode, cancel }) {
		Blockbench.removeListener('edit_texture', onEditTexture)
		Blockbench.removeListener('finish_edit', onEdit)
		Blockbench.removeListener('undo', onEdit)
		Blockbench.removeListener('redo', onEdit)
		Blockbench.removeListener('select_mode', onSelectMode)
		cancel()
		stroke = undefined
		PAINT_CONTEXT.set(undefined)
		clearColorwayPreviews()
	},
})

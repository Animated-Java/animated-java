/// <reference path="../global.d.ts"/>

import { getFsModule } from '../constants'
import type { IBlueprintDisplayEntityConfigJSON } from '../formats/blueprint'
import { resolvePath } from '../util/fileUtil'
import {
	isResourcePackPath,
	parseResourcePackPath,
	sanitizeStorageKey,
} from '../util/minecraftUtil'
import { detectCircularReferences, scrubUndefined } from '../util/misc'
import { Variant } from '../variants'
import type { INodeTransform, IRenderedAnimation } from './animationRenderer'
import { IntentionalExportError } from './errors'
import type {
	AnyRenderedNode,
	IRenderedElement,
	IRenderedFace,
	IRenderedModel,
	IRenderedRig,
} from './rigRenderer'
import { getSlotTextureKey } from './rigRenderer'

type StringVector3 = [string, string, string]

type TextureAnimationFrame =
	| number
	| {
			index: number
			time: number
	  }

interface TextureAnimation {
	interpolate?: boolean
	width?: number
	height?: number
	frametime?: number
	frames?: TextureAnimationFrame[]
}

type PluginTexture =
	| {
			type: 'custom'
			base64_string: string
			mime_type?: string
			animation?: TextureAnimation
	  }
	| {
			type: 'reference'
			resource_location: string
	  }

interface PluginTextureSlot {
	default_texture: string
	textures: string[]
}

/** Slot key -> texture key. Slots left out are unchanged. */
type TextureSlotChanges = Record<string, string>

interface PluginVariant {
	is_default?: true
	texture_slots: TextureSlotChanges
	excluded_nodes: string[]
	entity_properties: Record<string, Record<string, unknown>>
}

type TextureProvider =
	| { type: 'texture'; texture: string }
	| { type: 'texture_slot'; texture_slot: string }

interface BoneElementFace {
	uv: ArrayVector4
	texture_provider: TextureProvider
	tintindex?: number
	rotation?: number
}

type BoneElementFaces = Partial<
	Record<'north' | 'east' | 'south' | 'west' | 'up' | 'down', BoneElementFace>
>

type BoneElementRotation =
	| {
			x: number
			y: number
			z: number
			origin: ArrayVector3
			rescale?: boolean
	  }
	| {
			angle: number
			axis: 'y' | 'x' | 'z'
			origin: ArrayVector3
			rescale?: boolean
	  }
	| ArrayVector3

interface BoneElement {
	from: ArrayVector3
	to: ArrayVector3
	rotation: BoneElementRotation
	shade?: boolean
	light_emission?: number
	faces: BoneElementFaces
	display_rotation?: ArrayVector3
}

interface NodeTransformation {
	matrix?: number[]
	decomposed?: {
		translation?: ArrayVector3
		left_rotation?: ArrayVector4
		scale?: ArrayVector3
	}
	position?: ArrayVector3
	rotation?: ArrayVector3
	head_rotation?: ArrayVector2
	scale?: ArrayVector3
}

type NodeType =
	| 'bone'
	| 'item_display'
	| 'block_display'
	| 'text_display'
	| 'interaction'
	| 'structure'
	| 'camera'
	| 'locator'

type PluginNode =
	| {
			type: 'bone'
			parent?: string
			default_transformation?: NodeTransformation
			entity_properties?: Record<string, unknown>
			elements: BoneElement[]
	  }
	| {
			type: Exclude<NodeType, 'bone'>
			parent?: string
			default_transformation?: NodeTransformation
			entity_properties?: Record<string, unknown>
	  }

type LoopMode = { type: 'once' } | { type: 'hold' } | { type: 'loop'; loop_delay?: string }

type TransformationKeyframeInterpolation =
	| { type: 'linear'; easing: string; easing_arguments?: number[] }
	| {
			type: 'bezier'
			left_handle_time: ArrayVector3
			left_handle_value: ArrayVector3
			right_handle_time: ArrayVector3
			right_handle_value: ArrayVector3
	  }
	| { type: 'catmullrom' }
	| { type: 'step' }

interface TransformationKeyframe {
	value: StringVector3
	post?: StringVector3
	interpolation: TransformationKeyframeInterpolation
}

interface PluginAnimation {
	loop_mode: LoopMode
	length: number
	blend_weight?: string
	start_delay?: string
	global_keyframes?: {
		variant?: Record<string, string[]>
		texture_slot?: Record<string, TextureSlotChanges>
		event?: Record<string, { events: string[] }>
	}
	node_keyframes?: Record<
		string,
		{
			position?: Record<string, TransformationKeyframe>
			rotation?: Record<string, TransformationKeyframe>
			scale?: Record<string, TransformationKeyframe>
		}
	>
}

/**
 * Schema version of the Plugin JSON. Bump this (and note the change in the
 * changelog) whenever the shape of {@link PluginBlueprintJson} changes in a
 * release, so consumers can branch on it. It is independent of the Animated
 * Java plugin version and only moves when this file format does.
 *
 * 2: `display_properties` renamed to `entity_properties`, added node `parent`,
 *    `settings.id` is now the raw blueprint id (no `animated_java:` prefix).
 * 3: `texture_palettes` replaced by `texture_slots`, the `texture_palette` texture provider by
 *    `texture_slot`, and the `texture` global keyframe by `texture_slot`. Added `variants` and the
 *    `variant` global keyframe.
 */
export const PLUGIN_JSON_FORMAT_VERSION = 3

export interface PluginBlueprintJson {
	$schema?: string
	format_version: number
	settings: {
		id: string
	}
	textures?: Record<string, PluginTexture>
	texture_slots?: Record<string, PluginTextureSlot>
	variants?: Record<string, PluginVariant>
	nodes?: Record<string, PluginNode>
	animations?: Record<string, PluginAnimation>
}

function ensureUniqueKey(baseKey: string, usedKeys: Set<string>) {
	const sanitizedBaseKey = sanitizeStorageKey(baseKey || 'unnamed')
	let key = sanitizedBaseKey
	let i = 2
	while (usedKeys.has(key)) {
		key = `${sanitizedBaseKey}_${i++}`
	}
	usedKeys.add(key)
	return key
}

function formatTimestamp(timestamp: number): string {
	let s = timestamp.toString()
	if (s.includes('e') || s.includes('E')) s = timestamp.toFixed(6)
	if (!s.includes('.')) s += '.0'
	return s
}

function toMolangNumber(value: number): string {
	if (!Number.isFinite(value)) return '0'
	const rounded = Math.round(value * 100000) / 100000
	if (Object.is(rounded, -0)) return '0'
	return rounded.toString()
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
	const [header, base64] = dataUrl.split(',', 2)
	if (!header || !base64) throw new Error('Invalid data URL')
	const mimeType = header.replace(/^data:/, '').split(';')[0] || 'image/png'
	return { mimeType, base64 }
}

function serializeNodeTransformation(transform: INodeTransform): NodeTransformation {
	return scrubUndefined({
		matrix: transform.matrix ? Array.from(transform.matrix) : undefined,
		decomposed: transform.decomposed
			? {
					translation: transform.decomposed.translation,
					left_rotation: transform.decomposed.left_rotation,
					scale: transform.decomposed.scale,
				}
			: undefined,
		position: transform.pos,
		rotation: transform.rot,
		head_rotation: transform.head_rot,
		scale: transform.scale,
	} satisfies NodeTransformation)
}

function serializeDisplayProperties(
	node: AnyRenderedNode,
	config: IBlueprintDisplayEntityConfigJSON | undefined
): Record<string, unknown> | undefined {
	const props: Record<string, unknown> = {}
	if (config?.billboard !== undefined) props.billboard = config.billboard

	const overrideBrightness = config?.override_brightness ?? false
	if (overrideBrightness) {
		props.is_custom_brightness_enabled = true
		props.custom_brightness = {
			sky: config?.sky_brightness ?? 0,
			block: config?.block_brightness ?? 0,
		}
	}

	if (config?.glowing !== undefined) props.is_glowing = config.glowing
	if (config?.override_glow_color) {
		const color = (config.glow_color ?? '#ffffff').replace('#', '')
		props.glow_color_override = parseInt(color, 16)
	}

	if (config?.shadow_radius !== undefined) props.shadow_radius = config.shadow_radius
	if (config?.shadow_strength !== undefined) props.shadow_strength = config.shadow_strength

	if (node.type === 'bone' && config?.enchanted !== undefined) {
		props.is_enchanted = config.enchanted
	}

	if (Object.keys(props).length === 0) return undefined
	return props
}

function intFromHex8(hex: string): number {
	if (hex.startsWith('#')) hex = hex.slice(1)
	const unsigned = parseInt(hex, 16)
	if (!Number.isFinite(unsigned)) return 0
	return unsigned > 0x7fffffff ? unsigned - 0x100000000 : unsigned
}

function serializeTextureProvider(options: {
	textureId: string
	textureIdToKey: Map<string, string>
	slotVariableToKey: Map<string, string>
}): TextureProvider {
	const slotKey = options.slotVariableToKey.get(options.textureId)
	if (slotKey) return { type: 'texture_slot', texture_slot: slotKey }

	const textureKey = options.textureIdToKey.get(options.textureId)
	if (!textureKey)
		throw new Error(`Missing texture mapping for texture id '${options.textureId}'`)

	return { type: 'texture', texture: textureKey }
}

function serializeFace(
	face: IRenderedFace,
	options: {
		textureIdToKey: Map<string, string>
		slotVariableToKey: Map<string, string>
	}
): BoneElementFace | undefined {
	if (!face.uv) return undefined
	const textureId = face.texture?.startsWith('#') ? face.texture.slice(1) : face.texture
	if (!textureId) return undefined

	return scrubUndefined({
		uv: face.uv as ArrayVector4,
		tintindex: face.tintindex,
		rotation: face.rotation,
		texture_provider: serializeTextureProvider({
			textureId,
			textureIdToKey: options.textureIdToKey,
			slotVariableToKey: options.slotVariableToKey,
		}),
	} satisfies BoneElementFace)
}

function serializeBoneElements(
	model: IRenderedModel,
	options: {
		textureIdToKey: Map<string, string>
		slotVariableToKey: Map<string, string>
	}
): BoneElement[] {
	const elements = model.elements ?? []
	return elements.map((el: IRenderedElement) => {
		const faces: BoneElementFaces = {}
		for (const [dir, face] of Object.entries(el.faces ?? {})) {
			const serializedFace = serializeFace(face as IRenderedFace, options)
			if (!serializedFace) continue
			;(faces as any)[dir] = serializedFace
		}

		const rotation = el.rotation ?? { angle: 0, axis: 'y', origin: [0, 0, 0] }

		return scrubUndefined({
			from: el.from as ArrayVector3,
			to: el.to as ArrayVector3,
			rotation,
			shade: el.shade,
			light_emission: el.light_emission,
			faces,
			display_rotation: (el as any).display_rotation,
		} satisfies BoneElement)
	})
}

function serializeNode(
	node: AnyRenderedNode,
	options: {
		parent?: string
		defaultVariantModels: Record<string, { model: IRenderedModel | null }>
		textureIdToKey: Map<string, string>
		slotVariableToKey: Map<string, string>
	}
): PluginNode {
	const base = {
		parent: options.parent,
		default_transformation: serializeNodeTransformation(node.default_transform),
	} as const

	const config = (node as any).configs?.default as IBlueprintDisplayEntityConfigJSON | undefined
	const displayProps = serializeDisplayProperties(node, config)

	switch (node.type) {
		case 'bone': {
			const model = options.defaultVariantModels[node.uuid]?.model
			if (!model) {
				throw new Error(`Missing model for bone node '${node.name}' (${node.uuid})`)
			}
			return scrubUndefined({
				type: 'bone',
				...base,
				entity_properties: displayProps,
				elements: serializeBoneElements(model, {
					textureIdToKey: options.textureIdToKey,
					slotVariableToKey: options.slotVariableToKey,
				}),
			} satisfies PluginNode)
		}
		case 'item_display': {
			return scrubUndefined({
				type: 'item_display',
				...base,
				entity_properties: scrubUndefined({
					...displayProps,
					item: (node as any).item,
					item_display: (node as any).item_display,
				}),
			} satisfies PluginNode)
		}
		case 'block_display': {
			return scrubUndefined({
				type: 'block_display',
				...base,
				entity_properties: scrubUndefined({
					...displayProps,
					block_state: (node as any).block,
				}),
			} satisfies PluginNode)
		}
		case 'text_display': {
			const argb = intFromHex8((node as any).background_color ?? '#40000000')
			return scrubUndefined({
				type: 'text_display',
				...base,
				entity_properties: scrubUndefined({
					...displayProps,
					alignment: (node as any).align,
					background_color: argb,
					is_default_background: argb === 0x40000000,
					is_see_through: (node as any).see_through,
					is_shadowed: (node as any).shadow,
					line_width: (node as any).line_width,
					text: (node as any).text,
				}),
			} satisfies PluginNode)
		}
		case 'interaction':
			return scrubUndefined({
				type: 'interaction',
				...base,
				entity_properties: {
					width: node.width,
					height: node.height,
				},
			})
		case 'struct':
			return { type: 'structure', ...base }
		case 'camera':
			return { type: 'camera', ...base }
		case 'locator':
			return { type: 'locator', ...base }
		default:
			throw new Error(`Unsupported node type: ${(node as any).type}`)
	}
}

function buildTextureSlots(options: { rig: IRenderedRig; textureIdToKey: Map<string, string> }) {
	const usedSlotKeys = new Set<string>()
	const slots: Record<string, PluginTextureSlot> = {}
	const slotUuidToKey = new Map<string, string>()
	const slotVariableToKey = new Map<string, string>()

	for (const [uuid, slot] of Object.entries(options.rig.texture_slots)) {
		const textures = slot.textures
			.map(texture => options.textureIdToKey.get(texture.id))
			.filter(key => key !== undefined)
		if (!textures.length) continue

		const key = ensureUniqueKey(slot.name, usedSlotKeys)
		slots[key] = { default_texture: textures[0], textures }
		slotUuidToKey.set(uuid, key)
		slotVariableToKey.set(getSlotTextureKey(slot.name), key)
	}

	return { slots, slotUuidToKey, slotVariableToKey }
}

/**
 * Converts slot UUID -> texture UUID pairs to slot key -> texture key, skipping slots and textures
 * that aren't exported.
 */
function toTextureSlotChanges(
	entries: Iterable<[string, string]>,
	options: { slotUuidToKey: Map<string, string>; textureIdToKey: Map<string, string> }
): TextureSlotChanges {
	const changes: TextureSlotChanges = {}
	for (const [slotUuid, textureUuid] of entries) {
		const slotKey = options.slotUuidToKey.get(slotUuid)
		const texture = Texture.all.find(t => t.uuid === textureUuid)
		const textureKey = texture && options.textureIdToKey.get(texture.id)
		if (slotKey && textureKey) changes[slotKey] = textureKey
	}
	return changes
}

function buildVariants(options: {
	rig: IRenderedRig
	slots: Record<string, PluginTextureSlot>
	slotUuidToKey: Map<string, string>
	textureIdToKey: Map<string, string>
	nodeUuidToId: Map<string, string>
}) {
	const { rig, nodeUuidToId } = options
	const variants: Record<string, PluginVariant> = {}
	const variantUuidToKey = new Map<string, string>()
	const usedVariantKeys = new Set<string>()

	for (const [uuid, variant] of Object.entries(rig.variants)) {
		const key = ensureUniqueKey(variant.name, usedVariantKeys)
		variantUuidToKey.set(uuid, key)

		// eslint-disable-next-line @typescript-eslint/naming-convention
		const texture_slots = variant.is_default
			? Object.fromEntries(
					Object.entries(options.slots).map(([slotKey, slot]) => [
						slotKey,
						slot.default_texture,
					])
				)
			: toTextureSlotChanges(Object.entries(variant.slot_textures), options)

		// eslint-disable-next-line @typescript-eslint/naming-convention
		const entity_properties: PluginVariant['entity_properties'] = {}
		for (const [nodeUuid, node] of Object.entries(rig.nodes)) {
			const nodeId = nodeUuidToId.get(nodeUuid)
			if (!nodeId || variant.excluded_nodes.includes(nodeUuid)) continue
			const configs = (node as any).configs as
				| {
						default?: IBlueprintDisplayEntityConfigJSON
						variants?: Record<string, IBlueprintDisplayEntityConfigJSON>
				  }
				| undefined
			const config = variant.is_default ? configs?.default : configs?.variants?.[uuid]
			const props = config && serializeDisplayProperties(node, config)
			if (props) entity_properties[nodeId] = props
		}

		variants[key] = scrubUndefined({
			is_default: variant.is_default ? (true as const) : undefined,
			texture_slots,
			excluded_nodes: variant.excluded_nodes
				.map(nodeUuid => nodeUuidToId.get(nodeUuid))
				.filter(id => id !== undefined),
			entity_properties,
		} satisfies PluginVariant)
	}

	return { variants, variantUuidToKey }
}

/**
 * The `variant` and `texture_slot` global keyframes of `animation`, from its rendered frames.
 */
function serializeGlobalKeyframes(
	animation: IRenderedAnimation,
	options: {
		variantUuidToKey: Map<string, string>
		slotUuidToKey: Map<string, string>
		textureIdToKey: Map<string, string>
	}
): PluginAnimation['global_keyframes'] {
	let keyframes: PluginAnimation['global_keyframes']
	for (const frame of animation.frames) {
		const timeKey = formatTimestamp(frame.time)

		const variants = (frame.variants ?? [])
			.map(uuid => options.variantUuidToKey.get(uuid))
			.filter(key => key !== undefined)
		if (variants.length) {
			keyframes ??= {}
			;(keyframes.variant ??= {})[timeKey] = variants
		}

		const changes = toTextureSlotChanges(Object.entries(frame.texture_slots ?? {}), options)
		if (Object.keys(changes).length) {
			keyframes ??= {}
			;(keyframes.texture_slot ??= {})[timeKey] = changes
		}
	}
	return keyframes
}

function serializeTexture(texture: Texture): PluginTexture {
	if (texture.path && isResourcePackPath(texture.path)) {
		const parsed = parseResourcePackPath(texture.path)
		if (parsed?.namespace === 'minecraft') {
			return {
				type: 'reference',
				resource_location: parsed.resourceLocation,
			}
		}
	}

	const dataUrl = texture.getDataURL()
	const { mimeType, base64 } = parseDataUrl(dataUrl)
	return scrubUndefined({
		type: 'custom',
		base64_string: base64,
		mime_type: mimeType,
		animation: texture.getMCMetaContent()?.animation,
	} satisfies PluginTexture)
}

function buildLoopMode(animation: IRenderedAnimation): LoopMode {
	switch (animation.loop_mode) {
		case 'loop':
			return { type: 'loop', loop_delay: String(animation.loop_delay ?? 0) }
		case 'hold':
			return { type: 'hold' }
		default:
			return { type: 'once' }
	}
}

function pad3<T>(arr: ArrayLike<T>, fill: T): [T, T, T] {
	return [arr[0] ?? fill, arr[1] ?? fill, arr[2] ?? fill]
}

function keyframeInterpolation(kf: _Keyframe): TransformationKeyframeInterpolation {
	switch (kf.interpolation) {
		case 'bezier':
			return {
				type: 'bezier',
				left_handle_time: pad3(kf.bezier_left_time, 0),
				left_handle_value: pad3(kf.bezier_left_value, 0),
				right_handle_time: pad3(kf.bezier_right_time, 0),
				right_handle_value: pad3(kf.bezier_right_value, 0),
			}
		case 'catmullrom':
			return { type: 'catmullrom' }
		case 'step':
			return { type: 'step' }
		default: {
			const out: TransformationKeyframeInterpolation = {
				type: 'linear',
				easing: kf.easing ?? 'linear',
			}
			if (kf.easingArgs?.length) out.easing_arguments = kf.easingArgs.slice()
			return out
		}
	}
}

function keyframeDataPoint(kf: _Keyframe, index: number): StringVector3 {
	return [String(kf.get('x', index)), String(kf.get('y', index)), String(kf.get('z', index))]
}

function serializeRawAnimation(options: {
	animation: IRenderedAnimation
	nodeUuidToId: Map<string, string>
	globalKeyframes: PluginAnimation['global_keyframes']
}): PluginAnimation {
	const { animation, nodeUuidToId } = options
	const bbAnimation = Blockbench.Animation.all.find(a => a.uuid === animation.uuid)
	if (!bbAnimation) {
		throw new IntentionalExportError(
			`Could not locate source animation for <code>${animation.name}</code>.`
		)
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	const node_keyframes: NonNullable<PluginAnimation['node_keyframes']> = {}

	for (const [animatorUuid, animator] of Object.entries(bbAnimation.animators)) {
		// @ts-expect-error - broken bb types
		const keyframes: _Keyframe[] | undefined = animator?.keyframes
		if (!keyframes?.length) continue

		const nodeId = nodeUuidToId.get(animatorUuid)

		for (const kf of keyframes) {
			const timeKey = formatTimestamp(kf.time)

			if (kf.channel === 'position' || kf.channel === 'rotation' || kf.channel === 'scale') {
				if (!nodeId) continue
				const channels = (node_keyframes[nodeId] ??= {})
				const bucket = (channels[kf.channel] ??= {})
				const entry: TransformationKeyframe = {
					value: keyframeDataPoint(kf, 0),
					interpolation: keyframeInterpolation(kf),
				}
				if (kf.data_points.length === 2) entry.post = keyframeDataPoint(kf, 1)
				bucket[timeKey] = entry
			}
		}
	}

	return scrubUndefined({
		loop_mode: buildLoopMode(animation),
		blend_weight: '1',
		start_delay: '0',
		length: bbAnimation.length,
		global_keyframes: options.globalKeyframes,
		node_keyframes,
	} satisfies PluginAnimation)
}

function serializeBakedAnimation(options: {
	animation: IRenderedAnimation
	nodeUuidToId: Map<string, string>
	globalKeyframes: PluginAnimation['global_keyframes']
}): PluginAnimation {
	const { animation, nodeUuidToId } = options

	// eslint-disable-next-line @typescript-eslint/naming-convention
	const node_keyframes: NonNullable<PluginAnimation['node_keyframes']> = {}

	for (const frame of animation.frames) {
		const timeKey = formatTimestamp(frame.time)

		for (const [uuid, transform] of Object.entries(frame.node_transforms)) {
			const nodeId = nodeUuidToId.get(uuid)
			if (!nodeId) continue

			const interpolation: TransformationKeyframeInterpolation =
				transform.interpolation === 'step' || transform.interpolation === 'pre-post'
					? { type: 'step' }
					: { type: 'linear', easing: 'linear' }

			const channels = (node_keyframes[nodeId] ??= {})
			const position = (channels.position ??= {})
			const rotation = (channels.rotation ??= {})
			const scale = (channels.scale ??= {})

			position[timeKey] = {
				value: transform.pos.map(toMolangNumber) as StringVector3,
				interpolation,
			}
			rotation[timeKey] = {
				value: transform.rot.map(toMolangNumber) as StringVector3,
				interpolation,
			}
			scale[timeKey] = {
				value: transform.scale.map(toMolangNumber) as StringVector3,
				interpolation,
			}
		}
	}

	return scrubUndefined({
		loop_mode: buildLoopMode(animation),
		blend_weight: '1',
		start_delay: '0',
		length: animation.frames.at(-1)?.time ?? 0,
		global_keyframes: options.globalKeyframes,
		node_keyframes,
	} satisfies PluginAnimation)
}

export function exportPluginBlueprint(options: {
	rig: IRenderedRig
	animations: IRenderedAnimation[]
}): void {
	const aj = Project!.animated_java

	const usedTextureKeys = new Set<string>()
	const textures: Record<string, PluginTexture> = {}
	const textureIdToKey = new Map<string, string>()

	for (const texture of Object.values(options.rig.textures)) {
		const baseKey = texture.name.replace(/\.png$/i, '')
		const key = ensureUniqueKey(baseKey, usedTextureKeys)
		textureIdToKey.set(texture.id, key)
		textures[key] = serializeTexture(texture)
	}

	const { slots, slotUuidToKey, slotVariableToKey } = buildTextureSlots({
		rig: options.rig,
		textureIdToKey,
	})

	const usedNodeKeys = new Set<string>()
	const nodeUuidToId = new Map<string, string>()
	for (const [uuid, node] of Object.entries(options.rig.nodes)) {
		nodeUuidToId.set(uuid, ensureUniqueKey(node.storage_name, usedNodeKeys))
	}

	const { variants, variantUuidToKey } = buildVariants({
		rig: options.rig,
		slots,
		slotUuidToKey,
		textureIdToKey,
		nodeUuidToId,
	})

	const defaultVariant = Variant.getDefault()
	const defaultVariantModels = options.rig.variants[defaultVariant.uuid]?.models ?? {}

	const nodes: Record<string, PluginNode> = {}
	for (const [uuid, node] of Object.entries(options.rig.nodes)) {
		const nodeId = nodeUuidToId.get(uuid)
		if (!nodeId) continue
		nodes[nodeId] = serializeNode(node, {
			parent: node.parent ? nodeUuidToId.get(node.parent) : undefined,
			defaultVariantModels,
			textureIdToKey,
			slotVariableToKey,
		})
	}

	const animations: Record<string, PluginAnimation> = {}
	const usedAnimationKeys = new Set<string>()
	const serialize = aj.baked_animations ? serializeBakedAnimation : serializeRawAnimation
	for (const animation of options.animations) {
		const key = ensureUniqueKey(animation.storage_name, usedAnimationKeys)
		const globalKeyframes = serializeGlobalKeyframes(animation, {
			variantUuidToKey,
			slotUuidToKey,
			textureIdToKey,
		})
		animations[key] = serialize({ animation, nodeUuidToId, globalKeyframes })
	}

	const blueprint: PluginBlueprintJson = scrubUndefined({
		format_version: PLUGIN_JSON_FORMAT_VERSION,
		settings: {
			id: aj.blueprint_id,
		},
		textures,
		texture_slots: slots,
		variants,
		nodes,
		animations,
	})

	if (detectCircularReferences(blueprint)) {
		throw new Error('Circular references detected in exported plugin blueprint.')
	}

	let exportPath: string
	try {
		exportPath = resolvePath(aj.json_file)
	} catch (e) {
		throw new IntentionalExportError(
			`Failed to resolve export path <code>${aj.json_file}</code>: ${String(e)}`
		)
	}

	const { existsSync, mkdirSync, writeFileSync } = getFsModule()

	try {
		const dir = PathModule.dirname(exportPath)
		if (dir && dir !== '.' && !existsSync(dir)) {
			mkdirSync(dir, { recursive: true })
		}
		writeFileSync(exportPath, compileJSON(blueprint).toString())
	} catch (e: any) {
		throw new IntentionalExportError(
			`Failed to write JSON file <code>${exportPath}</code>: ${String(e)}`
		)
	}
}

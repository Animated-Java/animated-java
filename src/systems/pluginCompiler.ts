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

interface TexturePalette {
	active_state: string
	states: Record<string, { texture: string }>
}

type TextureProvider =
	| { type: 'texture'; texture: string }
	| { type: 'texture_palette'; texture_palette: string }

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
	| 'structure'
	| 'camera'
	| 'locator'

type PluginNode =
	| {
			type: 'bone'
			default_transformation?: NodeTransformation
			display_properties?: Record<string, unknown>
			elements: BoneElement[]
	  }
	| {
			type: Exclude<NodeType, 'bone'>
			default_transformation?: NodeTransformation
			display_properties?: Record<string, unknown>
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
	value: [string, string, string]
	post?: [string, string, string]
	interpolation: TransformationKeyframeInterpolation
}

interface PluginAnimation {
	loop_mode: LoopMode
	length: number
	blend_weight?: string
	start_delay?: string
	global_keyframes?: {
		texture?: Record<string, Record<string, string>>
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

export interface PluginBlueprintJson {
	$schema?: string
	format_version: number
	settings: {
		id: string
	}
	textures?: Record<string, PluginTexture>
	texture_palettes?: Record<string, TexturePalette>
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

function readTextureAnimation(texture: Texture): TextureAnimation | undefined {
	if (!texture.path) return undefined
	const mcmetaPath = texture.path + '.mcmeta'

	const { existsSync, readFileSync } = getFsModule()

	if (!existsSync(mcmetaPath)) return undefined
	try {
		const parsed = JSON.parse(readFileSync(mcmetaPath, 'utf-8')) as {
			animation?: Record<string, unknown>
		}
		const anim = parsed.animation as any
		if (!anim) return undefined
		return scrubUndefined({
			interpolate: anim.interpolate,
			width: anim.width,
			height: anim.height,
			frametime: anim.frametime,
			frames: anim.frames,
		} satisfies TextureAnimation)
	} catch (e) {
		console.warn(`Failed to parse texture animation mcmeta for ${texture.name}:`, e)
		return undefined
	}
}

function serializeNodeTransformation(transform: INodeTransform): NodeTransformation {
	return scrubUndefined({
		matrix: transform.matrix.elements.slice(),
		decomposed: {
			translation: transform.decomposed.translation.toArray() as ArrayVector3,
			left_rotation: transform.decomposed.left_rotation.toArray() as ArrayVector4,
			scale: transform.decomposed.scale.toArray() as ArrayVector3,
		},
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
		props.custom_brightness = config?.brightness_override ?? 0
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
	textureKeyToPaletteId: Map<string, string>
}): TextureProvider {
	const textureKey = options.textureIdToKey.get(options.textureId)
	if (!textureKey)
		throw new Error(`Missing texture mapping for texture id '${options.textureId}'`)

	const paletteId = options.textureKeyToPaletteId.get(textureKey)
	if (paletteId) return { type: 'texture_palette', texture_palette: paletteId }

	return { type: 'texture', texture: textureKey }
}

function serializeFace(
	face: IRenderedFace,
	options: {
		textureIdToKey: Map<string, string>
		textureKeyToPaletteId: Map<string, string>
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
			textureKeyToPaletteId: options.textureKeyToPaletteId,
		}),
	} satisfies BoneElementFace)
}

function serializeBoneElements(
	model: IRenderedModel,
	options: {
		textureIdToKey: Map<string, string>
		textureKeyToPaletteId: Map<string, string>
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
		defaultVariantModels: Record<string, { model: IRenderedModel | null }>
		textureIdToKey: Map<string, string>
		textureKeyToPaletteId: Map<string, string>
	}
): PluginNode {
	const base = {
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
				display_properties: displayProps,
				elements: serializeBoneElements(model, {
					textureIdToKey: options.textureIdToKey,
					textureKeyToPaletteId: options.textureKeyToPaletteId,
				}),
			} satisfies PluginNode)
		}
		case 'item_display': {
			return scrubUndefined({
				type: 'item_display',
				...base,
				display_properties: scrubUndefined({
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
				display_properties: scrubUndefined({
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
				display_properties: scrubUndefined({
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

function buildPalettes(options: {
	textures: Record<string, PluginTexture>
	textureIdToKey: Map<string, string>
}): { palettes: Record<string, TexturePalette>; textureKeyToPaletteId: Map<string, string> } {
	const variants = Variant.allExcludingDefault()
	if (variants.length === 0) {
		return { palettes: {}, textureKeyToPaletteId: new Map() }
	}

	const usedPaletteKeys = new Set<string>()
	const palettes: Record<string, TexturePalette> = {}
	const textureKeyToPaletteId = new Map<string, string>()

	for (const texture of Object.values(Texture.all)) {
		// only exported textures
		const textureKey = options.textureIdToKey.get(texture.id)
		if (!textureKey) continue
		if (!options.textures[textureKey]) continue

		const states: Record<string, { texture: string }> = {
			default: { texture: textureKey },
		}

		let hasAnyAlternative = false
		for (const variant of variants) {
			const mapped = variant.textureMap.getMappedTexture(texture.uuid)
			let mappedKey: string = textureKey
			if (mapped) {
				const key = options.textureIdToKey.get(mapped.id)
				if (key) mappedKey = key
			}
			states[variant.name] = { texture: mappedKey }
			if (mappedKey !== textureKey) hasAnyAlternative = true
		}

		if (!hasAnyAlternative) continue

		const paletteId = ensureUniqueKey(`${textureKey}_palette`, usedPaletteKeys)
		palettes[paletteId] = {
			active_state: 'default',
			states,
		}
		textureKeyToPaletteId.set(textureKey, paletteId)
	}

	return { palettes, textureKeyToPaletteId }
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
		animation: readTextureAnimation(texture),
	} satisfies PluginTexture)
}

function serializeAnimation(options: {
	animation: IRenderedAnimation
	nodeUuidToId: Map<string, string>
	paletteIds: string[]
}): PluginAnimation {
	const { animation, nodeUuidToId } = options

	// eslint-disable-next-line @typescript-eslint/naming-convention
	const loop_mode: LoopMode =
		animation.loop_mode === 'loop'
			? { type: 'loop', loop_delay: String(animation.loop_delay ?? 0) }
			: animation.loop_mode === 'hold'
				? { type: 'hold' }
				: { type: 'once' }

	const maxTime = animation.frames.at(-1)?.time ?? 0

	// eslint-disable-next-line @typescript-eslint/naming-convention
	const node_keyframes: NonNullable<PluginAnimation['node_keyframes']> = {}

	for (const frame of animation.frames) {
		const timeKey = formatTimestamp(frame.time)
		for (const [uuid, transform] of Object.entries(frame.node_transforms)) {
			const nodeId = nodeUuidToId.get(uuid)
			if (!nodeId) continue
			node_keyframes[nodeId] ??= {}

			const createInterpolation = (): TransformationKeyframeInterpolation =>
				transform.interpolation === 'step' || transform.interpolation === 'pre-post'
					? { type: 'step' }
					: { type: 'linear', easing: 'linear' }

			node_keyframes[nodeId].position ??= {}
			node_keyframes[nodeId].rotation ??= {}
			node_keyframes[nodeId].scale ??= {}

			node_keyframes[nodeId].position![timeKey] = {
				value: [
					toMolangNumber(transform.pos[0]),
					toMolangNumber(transform.pos[1]),
					toMolangNumber(transform.pos[2]),
				],
				interpolation: createInterpolation(),
			}
			node_keyframes[nodeId].rotation![timeKey] = {
				value: [
					toMolangNumber(transform.rot[0]),
					toMolangNumber(transform.rot[1]),
					toMolangNumber(transform.rot[2]),
				],
				interpolation: createInterpolation(),
			}
			node_keyframes[nodeId].scale![timeKey] = {
				value: [
					toMolangNumber(transform.scale[0]),
					toMolangNumber(transform.scale[1]),
					toMolangNumber(transform.scale[2]),
				],
				interpolation: createInterpolation(),
			}
		}
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	let global_keyframes: NonNullable<PluginAnimation['global_keyframes']> | undefined

	// map the baked variant for each frame into the texture keyframes
	if (options.paletteIds.length) {
		const textureKeyframes: Record<string, Record<string, string>> = {}
		for (const frame of animation.frames) {
			if (!frame.variants?.length) continue
			const variant = Variant.getByUUID(frame.variants[0])
			if (!variant) continue
			const timeKey = formatTimestamp(frame.time)
			textureKeyframes[timeKey] ??= {}
			for (const paletteId of options.paletteIds) {
				textureKeyframes[timeKey][paletteId] = variant.name
			}
		}
		if (Object.keys(textureKeyframes).length) {
			global_keyframes ??= {}
			global_keyframes.texture = textureKeyframes
		}
	}

	return scrubUndefined({
		loop_mode,
		blend_weight: '1',
		start_delay: '0',
		length: maxTime,
		global_keyframes,
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
		const baseKey = texture.name.replace(/\\.png$/i, '')
		const key = ensureUniqueKey(baseKey, usedTextureKeys)
		textureIdToKey.set(texture.id, key)
		textures[key] = serializeTexture(texture)
	}

	const { palettes, textureKeyToPaletteId } = buildPalettes({ textures, textureIdToKey })
	const paletteIds = Object.keys(palettes)

	const usedNodeKeys = new Set<string>()
	const nodeUuidToId = new Map<string, string>()
	for (const [uuid, node] of Object.entries(options.rig.nodes)) {
		nodeUuidToId.set(uuid, ensureUniqueKey(node.storage_name, usedNodeKeys))
	}

	const defaultVariant = Variant.getDefault()
	const defaultVariantModels = options.rig.variants[defaultVariant.uuid]?.models ?? {}

	const nodes: Record<string, PluginNode> = {}
	for (const [uuid, node] of Object.entries(options.rig.nodes)) {
		const nodeId = nodeUuidToId.get(uuid)
		if (!nodeId) continue
		nodes[nodeId] = serializeNode(node, {
			defaultVariantModels,
			textureIdToKey,
			textureKeyToPaletteId,
		})
	}

	const animations: Record<string, PluginAnimation> = {}
	for (const animation of options.animations) {
		const key = ensureUniqueKey(animation.storage_name, new Set(Object.keys(animations)))
		animations[key] = serializeAnimation({
			animation,
			nodeUuidToId,
			paletteIds,
		})
	}

	const blueprint: PluginBlueprintJson = scrubUndefined({
		format_version: 1,
		settings: {
			id: `animated_java:${aj.blueprint_id}`,
		},
		textures,
		texture_palettes: palettes,
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

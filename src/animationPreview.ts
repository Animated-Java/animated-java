import { EFFECT_ANIMATOR_CHANNELS } from './mods/customKeyframes'
import { VanillaBlockDisplay } from './outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from './outliner/vanillaItemDisplay'
import { getSlotDefaultTexture, getSlotPreviewTexture, getSlotTextures } from './textureSlots'
import { Variant } from './variants'

/**
 * What an animation has applied to the rig at the previewed time. Only exists in Animate mode with
 * an animation selected. Otherwise the editor shows the Variant selected in the Variants panel.
 */
interface AnimationPreviewState {
	/** Every Variant applied so far, in order. */
	variants: Variant[]
	/** Bone UUID -> slot UUID -> texture UUID. Slots left out show their default texture. */
	boneSlots: Map<string, Map<string, string>>
}

type PreviewEvent =
	| { time: number; variants: Variant[] }
	| { time: number; textureSlots: Record<string, string> }

let state: AnimationPreviewState | undefined
let stateKey = ''

/**
 * The Variant whose display entity config `node` shows: the last applied Variant that changes it.
 */
export function getPreviewVariant(node: OutlinerNode): Variant | undefined {
	if (!state) return Variant.selected
	for (let i = state.variants.length - 1; i >= 0; i--) {
		const variant = state.variants[i]
		if (variant.excludedNodes.has(node.uuid)) continue
		const configs = (node as { configs?: { variants?: Record<string, unknown> } }).configs
		if (variant.isDefault || configs?.variants?.[variant.uuid] !== undefined) return variant
	}
	return Variant.getDefault()
}

/**
 * The texture a slot shows on faces of `bone`.
 */
export function getPreviewSlotTexture(slot: Texture, bone: OutlinerNode | undefined) {
	if (!state) {
		// The selected Variant leaves the slots it sets on excluded bones at their default.
		const variant = Variant.selected
		const excluded =
			bone && variant?.excludedNodes.has(bone.uuid) && variant.slotTextures.has(slot.uuid)
		return excluded ? getSlotDefaultTexture(slot) : getSlotPreviewTexture(slot)
	}
	const uuid = bone && state.boneSlots.get(bone.uuid)?.get(slot.uuid)
	const textures = getSlotTextures(slot)
	return textures.find(t => t.uuid === uuid) ?? textures[0]
}

function getAnimationStartVariants(animation: _Animation): Variant[] {
	const variants = (animation.preview_variants ?? [])
		.map(uuid => Variant.getByUUID(uuid))
		.filter((v): v is Variant => !!v)
	return variants.length ? variants : [Variant.getDefault()]
}

function getPreviewEvents(animation: _Animation, time: number): PreviewEvent[] {
	const effects = animation.animators.effects as unknown as EffectAnimator | undefined
	const events: PreviewEvent[] = []
	if (effects && !effects.muted[EFFECT_ANIMATOR_CHANNELS.VARIANT]) {
		for (const kf of effects[EFFECT_ANIMATOR_CHANNELS.VARIANT] as _Keyframe[]) {
			if (kf.time <= time) events.push({ time: kf.time, variants: kf.variants ?? [] })
		}
	}
	if (effects && !effects.muted[EFFECT_ANIMATOR_CHANNELS.TEXTURE_SLOT]) {
		for (const kf of effects[EFFECT_ANIMATOR_CHANNELS.TEXTURE_SLOT] as _Keyframe[]) {
			if (kf.time <= time)
				events.push({ time: kf.time, textureSlots: kf.texture_slots ?? {} })
		}
	}
	// Variants apply before texture slots on the same frame, like in-game.
	return events.sort(
		(a, b) => a.time - b.time || Number('textureSlots' in a) - Number('textureSlots' in b)
	)
}

/**
 * Replays what `animation` applies to the rig, from its start state up to `time`.
 */
export function computeAnimationPreviewState(
	animation: _Animation,
	time: number
): AnimationPreviewState {
	const result: AnimationPreviewState = { variants: [], boneSlots: new Map() }
	const bones = Group.all

	const applyVariant = (variant: Variant) => {
		result.variants.push(variant)
		for (const bone of bones) {
			if (variant.excludedNodes.has(bone.uuid)) continue
			if (variant.isDefault) {
				result.boneSlots.delete(bone.uuid)
				continue
			}
			for (const [slotUuid, textureUuid] of variant.slotTextures) {
				setBoneSlot(bone.uuid, slotUuid, textureUuid)
			}
		}
	}
	const applyTextureSlots = (textureSlots: Record<string, string>) => {
		for (const [slotUuid, textureUuid] of Object.entries(textureSlots)) {
			for (const bone of bones) setBoneSlot(bone.uuid, slotUuid, textureUuid)
		}
	}
	const setBoneSlot = (boneUuid: string, slotUuid: string, textureUuid: string) => {
		let slots = result.boneSlots.get(boneUuid)
		if (!slots) result.boneSlots.set(boneUuid, (slots = new Map()))
		slots.set(slotUuid, textureUuid)
	}

	for (const variant of getAnimationStartVariants(animation)) applyVariant(variant)
	applyTextureSlots(animation.preview_texture_slots ?? {})
	for (const event of getPreviewEvents(animation, time)) {
		if ('variants' in event) event.variants.forEach(applyVariant)
		else applyTextureSlots(event.textureSlots)
	}
	return result
}

function getStateKey(previewState: AnimationPreviewState | undefined) {
	if (!previewState) return ''
	const slots = [...previewState.boneSlots].map(([bone, map]) => [bone, [...map]])
	return JSON.stringify([previewState.variants.map(v => v.uuid), slots])
}

/**
 * Forgets the previewed animation, so the next update starts fresh. Used when switching projects.
 */
export function resetAnimationPreview() {
	state = undefined
	stateKey = ''
}

/**
 * Re-renders everything that depends on which Variant or slot texture is shown.
 */
export function refreshVariantPreview() {
	Canvas.updateAllFaces()
	VanillaBlockDisplay.forceUpdateAll()
	VanillaItemDisplay.forceUpdateAll()
}

/**
 * Previews the selected animation's Variants and texture slots in Animate mode, or the Variants
 * panel's selection everywhere else. Only re-renders when what's shown changes.
 */
export function updateAnimationPreview() {
	const animation = Modes.animate ? Blockbench.Animation.selected : undefined
	const next = animation ? computeAnimationPreviewState(animation, animation.time) : undefined
	const nextKey = getStateKey(next)
	const wasActive = !!state
	state = next
	if (nextKey === stateKey && wasActive === !!next) return
	stateKey = nextKey
	refreshVariantPreview()
}

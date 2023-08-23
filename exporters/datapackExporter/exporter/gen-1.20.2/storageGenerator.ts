import { loadUtil } from '../util'
import { Globals as G } from './globals'

export function loadStorageGenerator() {
	// const { formatStr, roundToN } = AnimatedJava.API
	const { NbtCompound, NbtList, NbtString } = AnimatedJava.API.deepslate
	const { matrixToNbtFloatArray } = loadUtil()

	function generateStorage() {
		const animations = G.exportData.renderedAnimations
		// const rig = G.exportData.rig

		const storage = new NbtCompound()
		for (const animation of animations) {
			const animationStorage = new NbtCompound()
			storage.set(animation.name, animationStorage)
			const frameList = new NbtList()
			animationStorage.set('frames', frameList)
			const nodeList = new NbtList()
			animationStorage.set('nodes', nodeList)
			for (const node of animation.frames[0].nodes) {
				nodeList.add(new NbtString(node.uuid))
			}
			for (const frame of animation.frames) {
				const frameStorage = new NbtCompound()
				frameList.add(frameStorage)
				for (const node of frame.nodes) {
					switch (node.type) {
						case 'bone': {
							const boneStorage = new NbtCompound()
							frameStorage.set(node.uuid, boneStorage)
							boneStorage.set('transformation', matrixToNbtFloatArray(node.matrix))
							break
						}
						case 'camera': {
							break
						}
						case 'locator': {
							break
						}
						default: {
							throw new Error(
								`Unknown node type found while constructing storage NBT: ${node.type}`
							)
						}
					}
				}
			}
		}

		return storage
	}

	return { generateStorage }
}

import { loadUtil, wrapNum } from '../util'
import { Globals as G } from './globals'

export type IFrameLeaf = AnimatedJava.ITreeLeaf<AnimatedJava.IRenderedAnimation['frames'][any]>
export type IFrameBranch = AnimatedJava.ITreeBranch<AnimatedJava.IRenderedAnimation['frames'][any]>
export type IFrameTree = IFrameBranch | IFrameLeaf

export function loadAnimationTreeGenerator() {
	// const { rig } = G.exportData
	const { formatStr, roundToN } = AnimatedJava.API
	const { NbtCompound, NbtInt } = AnimatedJava.API.deepslate
	const { matrixToNbtFloatArray } = loadUtil()

	function getBranchFileName(branch: IFrameBranch) {
		return `branch_${branch.minScoreIndex}_${branch.maxScoreIndex}`
	}

	function getRootLeafFileName(frame: IFrameLeaf) {
		return `leaf_${frame.scoreIndex}`
	}

	function getNodeLeafFileName(frame: IFrameLeaf) {
		return `leaf_${frame.scoreIndex}_as_bone`
	}

	function boneToString(node: AnimatedJava.IAnimationNode) {
		const data = new NbtCompound()
			.set('transformation', matrixToNbtFloatArray(node.matrix))
			.set('start_interpolation', new NbtInt(0))
		// console.log(node.interpolation)
		if (node.interpolation === 'instant') {
			// console.log('a')
			data.set('interpolation_duration', new NbtInt(0))
		} else if (node.interpolation === 'default') {
			// console.log('b')
			data.set('interpolation_duration', new NbtInt(G.DEFAULT_INTERPOLATION_DURATION))
		}
		return `execute if entity @s[tag=${formatStr(G.TAGS.namedBoneEntity, [
			node.name,
		])}] run data modify entity @s {} merge value ${data}`
	}

	function locatorToString(node: AnimatedJava.IAnimationNode) {
		const pos = node.pos
		const euler = new THREE.Euler().setFromQuaternion(node.rot, 'YXZ')
		const rot = new THREE.Vector3(euler.x, euler.y, euler.z).multiplyScalar(180 / Math.PI)
		return `execute if entity @s[tag=${formatStr(G.TAGS.namedLocatorOrigin, [
			node.name,
		])}] at @s on origin run tp @s ^${roundToN(pos.x, 100000)} ^${roundToN(
			pos.y,
			100000
		)} ^${roundToN(pos.z, 100000)} ~${roundToN(
			wrapNum(-rot.y - 180, -180, 180),
			100000
		)} ~${roundToN(-rot.x, 100000)}`
	}

	function cameraToString(node: AnimatedJava.IAnimationNode) {
		const pos = node.pos
		const euler = new THREE.Euler().setFromQuaternion(node.rot, 'YXZ')
		const rot = new THREE.Vector3(euler.x, euler.y, euler.z).multiplyScalar(180 / Math.PI)
		return `execute if entity @s[tag=${formatStr(G.TAGS.namedCameraOrigin, [
			node.name,
		])}] at @s on origin run tp @s ^${roundToN(pos.x, 100000)} ^${roundToN(
			pos.y - 1.62,
			100000
		)} ^${roundToN(pos.z, 100000)} ~${roundToN(
			wrapNum(-rot.y - 180, -180, 180),
			100000
		)} ~${roundToN(-rot.x, 100000)}`
	}

	function generateNodeLeafFunction(leaf: IFrameLeaf) {
		const commands: string[] = []
		for (const node of Object.values(leaf.item.nodes)) {
			switch (node.type) {
				case 'bone': {
					commands.push(boneToString(node))
					break
				}
				case 'camera': {
					commands.push(cameraToString(node))
					break
				}
				case 'locator': {
					commands.push(locatorToString(node))
					break
				}
				default: {
					throw new Error(`Unknown node type: ${node.type}`)
				}
			}
		}
		return commands
	}

	function generateRootLeafFunction(
		frameTreeFolder: AnimatedJava.VirtualFolder,
		animName: string,
		leaf: IFrameLeaf
	) {
		const commands: string[] = []
		commands.push(
			G.IS_SINGLE_ENTITY_RIG
				? // prettier-ignore
				  `function ${G.INTERNAL_PATH}/animations/${animName}/tree/${getNodeLeafFileName(leaf)}`
				: // prettier-ignore
				  `execute on passengers run function ${G.INTERNAL_PATH}/animations/${animName}/tree/${getNodeLeafFileName(leaf)}`
		)
		if (!(leaf.item.commands || leaf.item.variant)) return commands

		const functions: Record<string, string[]> = {}

		if (leaf.item.commands) {
			const condition = leaf.item.commands.executeCondition
			const commands = leaf.item.commands.commands.split('\n')
			if (!functions[condition]) functions[condition] = []
			functions[condition].push(...commands)
		}

		if (leaf.item.variant) {
			const variant = G.VARIANTS.find(v => v.uuid === leaf.item.variant.uuid)
			let command = `function ${G.INTERNAL_PATH}/apply_variant/${variant.name}/as_root`
			const condition = leaf.item.variant.executeCondition
			if (condition) commands.push(`execute ${condition} run ${command}`)
			else commands.push(command)
		}

		for (const [condition, cmds] of Object.entries(functions)) {
			if (cmds.length === 0) continue
			if (cmds.length === 1) {
				if (condition)
					commands.push(
						`execute unless entity @s[tag=${G.TAGS.disableCommandKeyframes}] at @s ${condition} run ${cmds[0]}`
					)
				else
					commands.push(
						`execute unless entity @s[tag=${G.TAGS.disableCommandKeyframes}] at @s run ${cmds[0]}`
					)
				continue
			}
			const index = Object.keys(functions).indexOf(condition)
			frameTreeFolder.newFile(
				`${getRootLeafFileName(leaf)}_effects_${index}.mcfunction`,
				cmds
			)
			let command = `function ${
				G.INTERNAL_PATH
			}/animations/${animName}/tree/${getRootLeafFileName(leaf)}_effects_${index}`
			commands.push(
				condition
					? `execute unless entity @s[tag=${G.TAGS.disableCommandKeyframes}] at @s ${condition} run ${command}`
					: `execute unless entity @s[tag=${G.TAGS.disableCommandKeyframes}] at @s run ${command}`
			)
		}
		return commands
	}

	function buildFrameTree(
		anim: AnimatedJava.IRenderedAnimation,
		frameTree: IFrameTree,
		frameTreeFolder: AnimatedJava.VirtualFolder
	) {
		function recurse(tree: IFrameTree): string {
			if (tree.type === 'branch') {
				const content: string[] = []
				for (const item of tree.items) {
					content.push(recurse(item))
				}
				frameTreeFolder.newFile(getBranchFileName(tree) + '.mcfunction', content)

				return `execute if score @s ${G.SCOREBOARD.animTime} matches ${
					tree.minScoreIndex
				}..${tree.maxScoreIndex} run function ${G.INTERNAL_PATH}/animations/${
					anim.name
				}/tree/${getBranchFileName(tree)}`
			}

			frameTreeFolder.newFile(
				getRootLeafFileName(tree) + '.mcfunction',
				generateRootLeafFunction(frameTreeFolder, anim.name, tree)
			)

			frameTreeFolder.newFile(
				getNodeLeafFileName(tree) + '.mcfunction',
				generateNodeLeafFunction(tree)
			)

			return `execute if score @s ${G.SCOREBOARD.animTime} matches ${
				tree.scoreIndex
			} run function ${G.INTERNAL_PATH}/animations/${anim.name}/tree/${getRootLeafFileName(
				tree
			)}`
		}
		return recurse(frameTree)
	}

	return { buildFrameTree }
}

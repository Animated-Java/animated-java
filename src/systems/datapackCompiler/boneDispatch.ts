import type { IRenderedRig } from '../rigRenderer'

/** Node types that are display entities riding the root, animated by transformation. */
export const BONE_TYPES = ['bone', 'text_display', 'item_display', 'block_display']

const AUTO_GROUPING_MIN_BONES = 10

/**
 * Group sizes for bone dispatch. A bone finds its command by checking tags in order, so `n`
 * bones cost about `n / 2` checks each. Checking a group tag first, then the bones in that group,
 * costs about `groups / 2 + groupSize / 2`, which is lowest when groups hold `√n` bones.
 */
export function getBoneGroupSize(boneCount: number, configuredSize: number): number {
	if (configuredSize > 0) return configuredSize
	// Below this, the group check and extra function call cost about what grouping saves.
	if (boneCount < AUTO_GROUPING_MIN_BONES) return boneCount
	return Math.round(Math.sqrt(boneCount))
}

/**
 * Splits bones into groups of `groupSize`, in the given order. Bones should be in passenger order,
 * so each group is a run of neighboring passengers. Returns no groups when one would hold them all.
 */
export function groupBones(boneUuids: string[], groupSize: number): Map<string, number> {
	const groups = new Map<string, number>()
	if (groupSize >= boneUuids.length) return groups
	boneUuids.forEach((uuid, i) => groups.set(uuid, Math.floor(i / groupSize)))
	return groups
}

/** Each bone's dispatch group, in passenger order, for a rig. Empty for no grouping. */
export function getRigBoneGroups(rig: IRenderedRig, configuredSize: number): Map<string, number> {
	const bones = Object.values(rig.nodes)
		.filter(node => BONE_TYPES.includes(node.type))
		.map(node => node.uuid)
	return groupBones(bones, getBoneGroupSize(bones.length, configuredSize))
}

export interface BoneCommand {
	uuid: string
	/** The bone's own tag, which only it carries. */
	tag: string
	/** Runs as the bone. */
	command: string
}

export interface BoneDispatch {
	/** MCB source for the dispatch functions, to emit in the directory `path` points into. */
	mcb: string
	/** The function to run as any bone. */
	entry: string
	/** The function to run as one bone, when it's known which: it skips the group check. */
	functionFor: (uuid: string) => string
}

/**
 * Plain functions that run, as a bone, the command meant for it. Plain functions are parsed once,
 * where a macro would be parsed again whenever its arguments miss Minecraft's 8-entry cache.
 *
 * @param name The dispatch function's name. Group functions are named `<name>_<group>`.
 * @param path The resource location of the directory the functions are emitted in, ending in `/`.
 * @param groups Each bone's group, from {@link groupBones}. Empty for no grouping.
 * @param groupTag The tag every bone in a group carries.
 */
export function renderBoneDispatch(
	name: string,
	path: string,
	commands: BoneCommand[],
	groups: Map<string, number>,
	groupTag: (group: number) => string
): BoneDispatch {
	const line = (c: BoneCommand) =>
		`execute if entity @s[tag=${c.tag}] run return run ${c.command}`
	const fn = (functionName: string, lines: string[]) =>
		`function ${functionName} {\n${lines.join('\n')}\n}`

	if (groups.size === 0) {
		return {
			mcb: fn(name, commands.map(line)),
			entry: path + name,
			functionFor: () => path + name,
		}
	}

	const byGroup = new Map<number, BoneCommand[]>()
	for (const command of commands) {
		const group = groups.get(command.uuid)
		if (group === undefined) throw new Error(`Bone ${command.uuid} has no dispatch group`)
		byGroup.set(group, [...(byGroup.get(group) ?? []), command])
	}
	const sorted = [...byGroup].sort(([a], [b]) => a - b)
	return {
		mcb: [
			fn(
				name,
				sorted.map(
					([group]) =>
						`execute if entity @s[tag=${groupTag(group)}] run return run function ${path}${name}_${group}`
				)
			),
			...sorted.map(([group, groupCommands]) =>
				fn(`${name}_${group}`, groupCommands.map(line))
			),
		].join('\n'),
		entry: path + name,
		functionFor: uuid => `${path}${name}_${groups.get(uuid)}`,
	}
}

import { describe, expect, it } from '@jest/globals'
import {
	type BoneCommand,
	getBoneGroupSize,
	groupBones,
	renderBoneDispatch,
} from '../../systems/datapackCompiler/boneDispatch'

const PATH = 'ns:rig/frames/'
const groupTag = (group: number) => `rig.group.${group}`
const bone = (uuid: string): BoneCommand => ({
	uuid,
	tag: `rig.node.${uuid}`,
	command: `say ${uuid}`,
})

describe('getBoneGroupSize', () => {
	it('uses the configured size', () => {
		expect(getBoneGroupSize(100, 7)).toBe(7)
	})

	it('picks about √bones automatically', () => {
		expect(getBoneGroupSize(20, 0)).toBe(4)
		expect(getBoneGroupSize(100, 0)).toBe(10)
	})

	it("doesn't group small rigs automatically", () => {
		expect(getBoneGroupSize(9, 0)).toBe(9)
		expect(getBoneGroupSize(0, 0)).toBe(0)
	})
})

describe('groupBones', () => {
	it('splits bones into runs, in order', () => {
		expect([...groupBones(['a', 'b', 'c', 'd', 'e'], 2)]).toEqual([
			['a', 0],
			['b', 0],
			['c', 1],
			['d', 1],
			['e', 2],
		])
	})

	it('returns no groups when one group would hold every bone', () => {
		expect(groupBones(['a', 'b'], 2).size).toBe(0)
		expect(groupBones([], 1).size).toBe(0)
	})
})

describe('renderBoneDispatch', () => {
	it('checks each bone in one function without groups', () => {
		const dispatch = renderBoneDispatch(
			'3_bones',
			PATH,
			[bone('a'), bone('b')],
			new Map(),
			groupTag
		)
		expect(dispatch.mcb).toBe(
			'function 3_bones {\n' +
				'execute if entity @s[tag=rig.node.a] run return run say a\n' +
				'execute if entity @s[tag=rig.node.b] run return run say b\n' +
				'}'
		)
		expect(dispatch.entry).toBe('ns:rig/frames/3_bones')
		expect(dispatch.functionFor('a')).toBe('ns:rig/frames/3_bones')
	})

	it('checks the group first, skipping groups with nothing to run', () => {
		const groups = groupBones(['a', 'b', 'c', 'd', 'e'], 2)
		const dispatch = renderBoneDispatch(
			'3_bones',
			PATH,
			[bone('e'), bone('a')],
			groups,
			groupTag
		)
		expect(dispatch.mcb).toBe(
			'function 3_bones {\n' +
				'execute if entity @s[tag=rig.group.0] run return run function ns:rig/frames/3_bones_0\n' +
				'execute if entity @s[tag=rig.group.2] run return run function ns:rig/frames/3_bones_2\n' +
				'}\n' +
				'function 3_bones_0 {\nexecute if entity @s[tag=rig.node.a] run return run say a\n}\n' +
				'function 3_bones_2 {\nexecute if entity @s[tag=rig.node.e] run return run say e\n}'
		)
		expect(dispatch.functionFor('e')).toBe('ns:rig/frames/3_bones_2')
	})

	it('refuses a bone outside the groups', () => {
		const groups = groupBones(['a', 'b', 'c'], 1)
		expect(() => renderBoneDispatch('x', PATH, [bone('z')], groups, groupTag)).toThrow(/z/)
	})
})

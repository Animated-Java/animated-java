import { describe, expect, it } from '@jest/globals'
import { getProjectId } from '../../systems/datapackCompiler/projectId'

describe('getProjectId', () => {
	it('is stable across exports', () => {
		// Changing the hash would strand every summoned rig's project ID score.
		expect(getProjectId('animated_java:my_blueprint')).toBe(
			getProjectId('animated_java:my_blueprint')
		)
		expect(getProjectId('bench:creature')).toMatchInlineSnapshot(`927402238`)
	})

	it('fits a non-negative scoreboard value', () => {
		for (const id of ['a:b', 'gametest:custom/nested/path', 'ns:日本語', 'x'.repeat(500)]) {
			const projectId = getProjectId(id)
			expect(Number.isInteger(projectId)).toBe(true)
			expect(projectId).toBeGreaterThanOrEqual(0)
			expect(projectId).toBeLessThanOrEqual(2 ** 31 - 1)
		}
	})

	it('tells similar blueprint IDs apart', () => {
		const ids = ['ns:rig', 'ns:rig1', 'ns:rig2', 'ns:Rig', 'ns:rig/a', 'ns2:rig']
		expect(new Set(ids.map(getProjectId)).size).toBe(ids.length)
	})
})

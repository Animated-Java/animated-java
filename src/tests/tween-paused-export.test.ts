import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { type ExportRun, relFiles, runFixtureExport } from './helpers/export'

/**
 * `tween_paused` runs `tween`, then tags the root with `aj.pause_after_tween`. The animation's
 * `zzz/on_tick` pauses it instead of playing once the tween finishes, and `play` / `pause_all`
 * clear the tag so a pending pause can't leak into a later animation.
 */

const PAUSE_TAG = 'aj.pause_after_tween'

function readMatching(run: ExportRun, files: string[], match: (file: string) => boolean) {
	return files
		.filter(match)
		.map(f => fs.readFileSync(path.join(run.dataPackFolder, f), 'utf-8'))
		.join('\n')
}

// 1.20.4 is the oldest main.mcb, 26.2 resolves to the newest.
describe.each(['1.20.4', '26.2'])('tween_paused export (%s)', targetVersion => {
	let run: ExportRun
	let dpFiles: string[]
	const read = (match: (file: string) => boolean) => readMatching(run, dpFiles, match)

	beforeAll(async () => {
		run = await runFixtureExport({
			fixture: 'test_blueprints/Dummy.ajblueprint',
			targetVersion,
		})
		dpFiles = relFiles(run.dataPackFolder)
	}, 180_000)

	afterAll(() => run?.cleanup())

	it('exports', () => {
		expect(run.ok).toBe(true)
	})

	it('tags the root after tweening, so the tween does not clear the tag', () => {
		const tweenPaused = read(f => f.endsWith('/animations/floss/tween_paused.mcfunction'))
		const tweenCall = tweenPaused.indexOf('animations/floss/tween {')
		const tagAdd = tweenPaused.indexOf(`tag @s add ${PAUSE_TAG}`)
		expect(tweenCall).toBeGreaterThan(-1)
		expect(tagAdd).toBeGreaterThan(tweenCall)
	})

	it('pauses the animation once a paused tween finishes', () => {
		const onTick = read(
			f =>
				f.includes('/animations/floss/zzz/on_tick') ||
				f.endsWith('/animations/floss/zzz/pause_after_tween.mcfunction')
		)
		expect(onTick).toMatch(/matches \.\.0/)
		expect(onTick).toContain(`if entity @s[tag=${PAUSE_TAG}]`)
		expect(onTick).toContain(`tag @s remove ${PAUSE_TAG}`)
		expect(onTick).toContain('tag @s remove aj_booth_rigs.dummy.animation.floss.playing')
	})

	it('clears a pending pause when playing or pausing every animation', () => {
		expect(read(f => f.endsWith('/animations/floss/play.mcfunction'))).toContain(
			`tag @s remove ${PAUSE_TAG}`
		)
		expect(read(f => f.endsWith('/animations/pause_all.mcfunction'))).toContain(
			`tag @s remove ${PAUSE_TAG}`
		)
	})
})

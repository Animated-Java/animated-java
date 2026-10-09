import { describe, expect, it } from '@jest/globals'
import { buildAnnouncement } from '../../../.scripts/release/announcement'
import { type ChangelogEntry, getReleaseUrl } from '../../../.scripts/release/releaseNotes'

function entry(categories: Record<string, string[]>): ChangelogEntry {
	return {
		title: 'test',
		author: 'test',
		date: '2026-10-07',
		categories: Object.entries(categories).map(([title, list]) => ({ title, list })),
	}
}

/** Every Text Display's content, in order, wherever it's nested. */
function texts(components: any[]): string[] {
	return components.flatMap(c =>
		c.type === 10 ? [c.content] : c.components ? texts(c.components) : []
	)
}

describe('buildAnnouncement', () => {
	it('lays out a header, one section per category, install links and pings', () => {
		const components = buildAnnouncement(
			'1.2.0',
			entry({ Changes: ['a'], Fixes: ['b'], Other: ['c'], Empty: [] }),
			['111', '222']
		)
		expect(components.map(c => c.type)).toEqual([9, 14, 10, 10, 10, 14, 9, 1, 10])
		expect(texts(components)).toEqual([
			'# <:AnimatedJava:1349340042379661392> Animated Java v1.2.0\n-# Minor release · October 7, 2026',
			'## ✨ Changes\n- a',
			'## 🐛 Fixes\n- b',
			'## Other\n- c',
			expect.stringContaining('## 📦 How to Install'),
			'-# <@&111> <@&222>',
		])
		expect(components[6].accessory.url).toBe(
			'https://github.com/Animated-Java/animated-java/releases/download/v1.2.0/animated_java.js'
		)
		expect(components[7].components[0].url).toBe(getReleaseUrl('1.2.0'))
	})

	it('moves breaking changes into their own section first', () => {
		const components = buildAnnouncement(
			'1.2.1',
			entry({ Changes: ['a', '[BREAKING] b'], Fixes: ['[BREAKING] c'] }),
			[]
		)
		expect(texts(components).slice(1, 3)).toEqual([
			'## ⚠️ Breaking Changes\n- b\n- c',
			'## ✨ Changes\n- a',
		])
	})

	it('leaves out the ping footer when there are no roles', () => {
		const components = buildAnnouncement('1.2.0', entry({ Changes: ['a'] }), [])
		expect(components.at(-1)!.type).toBe(1)
	})

	it('drops items to fit, keeping breaking changes and noting how many were cut', () => {
		const changelog = entry({
			Changes: ['[BREAKING] ' + 'x'.repeat(1500), 'a'.repeat(1000)],
			Fixes: ['b'.repeat(1000), 'c'.repeat(1000)],
		})
		const all = texts(buildAnnouncement('1.2.0', changelog, [])).join('')
		expect(all.length).toBeLessThanOrEqual(4000)
		expect(all).toContain('x'.repeat(1500))
		// Fixes drops first on the tie, then Changes keeps the larger share and loses its item.
		expect(all).toContain('b'.repeat(1000))
		expect(all).not.toContain('a'.repeat(1000))
		expect(all).not.toContain('c'.repeat(1000))
		expect(all).toContain(
			`-# …plus 2 more in the [full release notes](${getReleaseUrl('1.2.0')})`
		)
	})

	it('trims categories in proportion to their size', () => {
		const changelog = entry({
			Changes: Array.from({ length: 16 }, (_, i) => `change ${i} `.padEnd(150, '.')),
			Fixes: Array.from({ length: 8 }, (_, i) => `fix ${i} `.padEnd(150, '.')),
		})
		const all = texts(buildAnnouncement('1.2.0', changelog, []))
		const count = (heading: string) =>
			all.find(t => t.startsWith(heading))!.split('\n- ').length - 1
		const changes = count('## ✨ Changes')
		const fixes = count('## 🐛 Fixes')
		expect(changes + fixes).toBeLessThan(24)
		expect(Math.abs(changes - 2 * fixes)).toBeLessThanOrEqual(2)
		expect(all.join('')).toContain('change 0 ')
		expect(all.join('')).toContain('fix 0 ')
	})

	it('throws when breaking changes alone do not fit', () => {
		const changelog = entry({ Changes: ['[BREAKING] ' + 'x'.repeat(4000)] })
		expect(() => buildAnnouncement('1.2.0', changelog, [])).toThrow("don't fit in 4000")
	})
})

import { describe, expect, it } from '@jest/globals'
import {
	type ChangelogEntry,
	getChangelogEntry,
	getReleasePings,
	getReleaseUrl,
	renderReleaseNotes,
} from '../../../.scripts/release/releaseNotes'

function entry(...lists: string[][]): ChangelogEntry {
	return {
		title: 'test',
		author: 'test',
		date: '2026-01-01',
		categories: lists.map((list, i) => ({ title: `Category ${i}`, list })),
	}
}

describe('getChangelogEntry', () => {
	it('throws for a missing version', () => {
		expect(() => getChangelogEntry({}, '1.0.0')).toThrow(
			'No changelog entry found for version 1.0.0'
		)
	})
})

describe('getReleasePings', () => {
	it('pings minor for x.y.0', () => {
		expect(getReleasePings('1.11.0', entry(['a']))).toEqual(['minor'])
		expect(getReleasePings('2.0.0', entry(['a']))).toEqual(['minor'])
	})

	it('pings patch for x.y.z', () => {
		expect(getReleasePings('1.11.3', entry(['a']))).toEqual(['patch'])
	})

	it('pings only prerelease for betas', () => {
		expect(getReleasePings('1.11.0-beta.1', entry(['a']))).toEqual(['prerelease'])
	})

	it('adds breaking when any item is tagged', () => {
		expect(getReleasePings('1.11.1', entry(['a'], ['[BREAKING] b']))).toEqual([
			'patch',
			'breaking',
		])
		expect(getReleasePings('1.11.0-beta.2', entry(['[BREAKING] a']))).toEqual([
			'prerelease',
			'breaking',
		])
	})

	it('throws for an invalid version', () => {
		expect(() => getReleasePings('v1.0', entry())).toThrow('Invalid version')
	})
})

describe('renderReleaseNotes', () => {
	it('fills template variables and formats categories', () => {
		const notes = renderReleaseNotes(
			'# v{version}\n\n{categories}\n\n[release]({release_url}) {pings} {unknown}',
			'1.2.3',
			entry(['[BREAKING] a', 'b'], [], ['c']),
			{ vars: { pings: '<@&1>' } }
		)
		expect(notes).toBe(
			'# v1.2.3\n\n' +
				'### Category 0\n\n- ⚠️ **BREAKING** — a\n- b\n\n' +
				'### Category 2\n\n- c\n\n' +
				`[release](${getReleaseUrl('1.2.3')}) <@&1> {unknown}\n`
		)
	})

	it('uses a custom breaking label', () => {
		const notes = renderReleaseNotes('{categories}', '1.0.0', entry(['[BREAKING] a']), {
			breakingLabel: '<:B:1>',
		})
		expect(notes).toBe('### Category 0\n\n- <:B:1> a\n')
	})

	it('escapes URLs once when the template asks for it', () => {
		const notes = renderReleaseNotes(
			'[[ESCAPE_URLS]]\n{categories}',
			'1.0.0',
			entry(['[x](https://a.com/b)', '[y](<https://c.com>)'])
		)
		expect(notes).toBe('### Category 0\n\n- [x](<https://a.com/b>)\n- [y](<https://c.com>)\n')
	})

	it('leaves notes untouched when they fit', () => {
		const template = '{categories}'
		const full = renderReleaseNotes(template, '1.0.0', entry(['a', 'b']))
		expect(
			renderReleaseNotes(template, '1.0.0', entry(['a', 'b']), { maxLength: full.length })
		).toBe(full)
	})

	it('drops items from the end until the notes fit', () => {
		const changelog = entry(['a'.repeat(50), 'b'.repeat(50)], ['c'.repeat(50)])
		const notes = renderReleaseNotes('{categories}', '1.0.0', changelog, { maxLength: 180 })
		expect(notes.length).toBeLessThanOrEqual(180)
		expect(notes).toContain('a'.repeat(50))
		expect(notes).not.toContain('b'.repeat(50))
		expect(notes).not.toContain('Category 1')
		expect(notes).toContain(`[full release notes](${getReleaseUrl('1.0.0')})`)
	})

	it('throws when even an empty changelog does not fit', () => {
		expect(() =>
			renderReleaseNotes('x'.repeat(100) + '{categories}', '1.0.0', entry(['a']), {
				maxLength: 50,
			})
		).toThrow("don't fit in 50 characters")
	})
})

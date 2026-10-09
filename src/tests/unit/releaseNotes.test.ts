import { describe, expect, it } from '@jest/globals'
import {
	type ChangelogEntry,
	getChangelogEntry,
	getReleaseAssetUrl,
	getReleasePings,
	getReleaseType,
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

describe('getReleaseType', () => {
	it('classifies versions', () => {
		expect(getReleaseType('1.11.0')).toBe('minor')
		expect(getReleaseType('1.11.3')).toBe('patch')
		expect(getReleaseType('1.11.0-beta.1')).toBe('prerelease')
	})
})

describe('getReleaseAssetUrl', () => {
	it('points at a file on the release', () => {
		expect(getReleaseAssetUrl('1.2.3', 'animated_java.js')).toBe(
			'https://github.com/Animated-Java/animated-java/releases/download/v1.2.3/animated_java.js'
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
			'# v{version}\n\n{categories}\n\n[release]({release_url}) {unknown}',
			'1.2.3',
			entry(['[BREAKING] a', 'b'], [], ['c'])
		)
		expect(notes).toBe(
			'# v1.2.3\n\n' +
				'### Category 0\n\n- ⚠️ **BREAKING** — a\n- b\n\n' +
				'### Category 2\n\n- c\n\n' +
				`[release](${getReleaseUrl('1.2.3')}) {unknown}\n`
		)
	})
})

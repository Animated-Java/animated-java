export interface ChangelogCategory {
	title: string
	list: string[]
}

export interface ChangelogEntry {
	title: string
	author: string
	date: string
	categories: ChangelogCategory[]
}

export type Changelog = Record<string, ChangelogEntry>

export type ReleaseType = 'prerelease' | 'minor' | 'patch'
export type ReleasePing = ReleaseType | 'breaking'

export const BREAKING_TAG = '[BREAKING]'

const REPO_URL = 'https://github.com/Animated-Java/animated-java'
const BREAKING_LABEL = '⚠️ **BREAKING** —'
const VERSION_REGEX = /^(\d+)\.(\d+)\.(\d+)(-.+)?$/

export function getReleaseUrl(version: string) {
	return `${REPO_URL}/releases/tag/v${version}`
}

export function getReleaseAssetUrl(version: string, fileName: string) {
	return `${REPO_URL}/releases/download/v${version}/${fileName}`
}

export function getChangelogEntry(changelog: Changelog, version: string) {
	const entry = changelog[version]
	if (!entry) throw new Error(`No changelog entry found for version ${version}`)
	return entry
}

export function getReleaseType(version: string): ReleaseType {
	const match = VERSION_REGEX.exec(version)
	if (!match) throw new Error(`Invalid version "${version}"`)
	const [, , , patch, prerelease] = match
	if (prerelease) return 'prerelease'
	return patch === '0' ? 'minor' : 'patch'
}

/**
 * Picks which Discord roles to ping for a release: one for the release type, plus `breaking` if any
 * changelog item is tagged `[BREAKING]`.
 */
export function getReleasePings(version: string, entry: ChangelogEntry) {
	const pings: ReleasePing[] = [getReleaseType(version)]
	if (entry.categories.some(category => category.list.some(item => item.includes(BREAKING_TAG))))
		pings.push('breaking')
	return pings
}

function replaceTemplateVars(str: string, items: Record<string, string>) {
	return str.replace(/\{(.+?)\}/g, str => items[str.replace(/[\{\}]/g, '')] ?? str)
}

function formatCategories(categories: ChangelogCategory[]) {
	return categories
		.filter(category => category.list.length > 0)
		.map(
			category =>
				`### ${category.title}\n\n` +
				category.list
					.map(item => '- ' + item.replaceAll(BREAKING_TAG, BREAKING_LABEL))
					.join('\n')
		)
		.join('\n\n')
}

export function renderReleaseNotes(template: string, version: string, entry: ChangelogEntry) {
	const content = replaceTemplateVars(template, {
		version,
		release_url: getReleaseUrl(version),
		categories: formatCategories(entry.categories),
	})
	return content.trim() + '\n'
}

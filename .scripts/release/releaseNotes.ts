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

export type ReleasePing = 'prerelease' | 'minor' | 'patch' | 'breaking'

export interface RenderOptions {
	/** Extra `{name}` template variables, such as `pings`. */
	vars?: Record<string, string>
	/** Drop changelog items from the end until the notes fit, noting that some were cut. */
	maxLength?: number
	/** Replaces `[BREAKING]` in changelog items. */
	breakingLabel?: string
}

const REPO_URL = 'https://github.com/Animated-Java/animated-java'
const BREAKING_TAG = '[BREAKING]'
const DEFAULT_BREAKING_LABEL = '⚠️ **BREAKING** —'
const ESCAPE_URLS_MARKER = '[[ESCAPE_URLS]]'
const VERSION_REGEX = /^(\d+)\.(\d+)\.(\d+)(-.+)?$/
// Skips URLs already wrapped in <>, so they aren't escaped twice.
const URL_REGEX =
	/(?<!<)https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9]{1,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gm

export function getReleaseUrl(version: string) {
	return `${REPO_URL}/releases/tag/v${version}`
}

export function getChangelogEntry(changelog: Changelog, version: string) {
	const entry = changelog[version]
	if (!entry) throw new Error(`No changelog entry found for version ${version}`)
	return entry
}

/**
 * Picks which Discord roles to ping for a release: one for the release type, plus `breaking` if any
 * changelog item is tagged `[BREAKING]`.
 */
export function getReleasePings(version: string, entry: ChangelogEntry) {
	const match = VERSION_REGEX.exec(version)
	if (!match) throw new Error(`Invalid version "${version}"`)
	const [, , , patch, prerelease] = match

	const pings: ReleasePing[] = []
	if (prerelease) pings.push('prerelease')
	else if (patch === '0') pings.push('minor')
	else pings.push('patch')

	if (entry.categories.some(category => category.list.some(item => item.includes(BREAKING_TAG))))
		pings.push('breaking')
	return pings
}

function replaceTemplateVars(str: string, items: Record<string, string>) {
	return str.replace(/\{(.+?)\}/g, str => items[str.replace(/[\{\}]/g, '')] ?? str)
}

function formatCategories(categories: ChangelogCategory[], breakingLabel: string) {
	return categories
		.filter(category => category.list.length > 0)
		.map(
			category =>
				`### ${category.title}\n\n` +
				category.list
					.map(item => '- ' + item.replaceAll(BREAKING_TAG, breakingLabel))
					.join('\n')
		)
		.join('\n\n')
}

/** Returns a copy of `categories` without its last item, or `undefined` if there are none left. */
function dropLastItem(categories: ChangelogCategory[]) {
	let index = categories.length - 1
	while (index >= 0 && categories[index].list.length === 0) index--
	if (index === -1) return
	return categories.map((category, i) =>
		i === index ? { ...category, list: category.list.slice(0, -1) } : category
	)
}

export function renderReleaseNotes(
	template: string,
	version: string,
	entry: ChangelogEntry,
	options: RenderOptions = {}
) {
	const render = (categories: ChangelogCategory[], trimmed: boolean) => {
		let formatted = formatCategories(
			categories,
			options.breakingLabel ?? DEFAULT_BREAKING_LABEL
		)
		if (trimmed) {
			formatted += `\n\n-# …plus more in the [full release notes](${getReleaseUrl(version)})`
		}
		let content = replaceTemplateVars(template, {
			...options.vars,
			version,
			release_url: getReleaseUrl(version),
			categories: formatted,
		})
		if (content.includes(ESCAPE_URLS_MARKER)) {
			content = content
				.replace(ESCAPE_URLS_MARKER, '')
				.replaceAll(URL_REGEX, match => `<${match}>`)
		}
		return content.trim() + '\n'
	}

	let categories: ChangelogCategory[] | undefined = entry.categories
	let notes = render(categories, false)
	if (options.maxLength === undefined) return notes

	while (notes.length > options.maxLength) {
		categories = dropLastItem(categories)
		if (!categories) {
			throw new Error(
				`Release notes for ${version} don't fit in ${options.maxLength} characters, even with every changelog item removed`
			)
		}
		notes = render(categories, true)
	}
	return notes
}

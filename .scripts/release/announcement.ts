import {
	type ChangelogCategory,
	type ChangelogEntry,
	BREAKING_TAG,
	getReleaseAssetUrl,
	getReleaseType,
	getReleaseUrl,
} from './releaseNotes'

// Shared by every Text Display in a Components V2 message.
const MAX_TEXT_LENGTH = 4000

const ANIMATED_JAVA_EMOJI = '<:AnimatedJava:1349340042379661392>'
const ICON_URL =
	'https://raw.githubusercontent.com/Animated-Java/animated-java/refs/heads/main/src/assets/icons/animated_java_fancy_icon_centered.png'
const INSTALL_GUIDE_URL = 'https://animated-java.dev/docs/getting-started/installing'
const BREAKING_TITLE = 'Breaking Changes'
const RELEASE_TYPE_LABELS = {
	prerelease: 'Pre-release',
	minor: 'Minor release',
	patch: 'Patch release',
}
const CATEGORY_EMOJI: Record<string, string> = {
	[BREAKING_TITLE]: '⚠️',
	Changes: '✨',
	Fixes: '🐛',
}

function textDisplay(content: string) {
	return { type: 10, content }
}

function largeSeparator() {
	return { type: 14, spacing: 2 }
}

function linkButton(label: string, url: string) {
	return { type: 2, style: 5, label, url }
}

function formatDate(date: string) {
	return new Date(date).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })
}

function formatCategory({ title, list }: ChangelogCategory) {
	const emoji = CATEGORY_EMOJI[title]
	return `## ${emoji ? emoji + ' ' : ''}${title}\n` + list.map(item => '- ' + item).join('\n')
}

/** Moves every `[BREAKING]` item into its own category, placed first. */
function splitBreaking(categories: ChangelogCategory[]): ChangelogCategory[] {
	const breaking: string[] = []
	const rest = categories.map(category => ({
		title: category.title,
		list: category.list.filter(item => {
			if (!item.includes(BREAKING_TAG)) return true
			breaking.push(item.replaceAll(BREAKING_TAG, '').trim())
			return false
		}),
	}))
	return [{ title: BREAKING_TITLE, list: breaking }, ...rest]
}

/**
 * Picks the category to drop an item from: the one keeping the largest share of its original
 * items, so every category shrinks proportionally. Ties go to the later category. Index 0 holds the
 * breaking changes, which are never dropped. Returns -1 when nothing is left to drop.
 */
function pickCategoryToTrim(categories: ChangelogCategory[], originalLengths: number[]) {
	let picked = -1
	let pickedShare = 0
	for (let i = 1; i < categories.length; i++) {
		const share = categories[i].list.length / originalLengths[i]
		if (share > 0 && share >= pickedShare) {
			picked = i
			pickedShare = share
		}
	}
	return picked
}

/**
 * Formats each non-empty category as its own section, dropping items from the ends of categories
 * until they fit in `budget` characters.
 */
function formatCategories(version: string, categories: ChangelogCategory[], budget: number) {
	const originalLengths = categories.map(category => category.list.length)
	categories = categories.map(category => ({ ...category, list: [...category.list] }))
	let dropped = 0
	for (;;) {
		const sections = categories.filter(category => category.list.length > 0).map(formatCategory)
		if (dropped > 0) {
			sections[sections.length - 1] +=
				`\n-# …plus ${dropped} more in the [full release notes](${getReleaseUrl(version)})`
		}
		if (sections.join('').length <= budget) return sections

		const index = pickCategoryToTrim(categories, originalLengths)
		if (index === -1) {
			throw new Error(
				`Release notes for ${version} don't fit in ${MAX_TEXT_LENGTH} characters, even with every non-breaking item removed`
			)
		}
		categories[index].list.pop()
		dropped++
	}
}

/**
 * Builds a release announcement as Components V2, in the style of the Animated Java Discord bot's
 * messages: a header with the icon, a section per changelog category, then install links.
 */
export function buildAnnouncement(version: string, entry: ChangelogEntry, roleIds: string[]) {
	const header = textDisplay(
		`# ${ANIMATED_JAVA_EMOJI} Animated Java v${version}\n` +
			`-# ${RELEASE_TYPE_LABELS[getReleaseType(version)]} · ${formatDate(entry.date)}`
	)
	const install = textDisplay(
		'## 📦 How to Install\n' +
			"New releases take a while to reach Blockbench's plugin list, so to get this one right away, " +
			`download \`animated_java.js\` directly or [install it via URL](${INSTALL_GUIDE_URL}#advanced-installation-url).`
	)
	const footer = roleIds.length
		? [textDisplay('-# ' + roleIds.map(id => `<@&${id}>`).join(' '))]
		: []

	const fixedLength = [header, install, ...footer].map(c => c.content).join('').length
	const sections = formatCategories(
		version,
		splitBreaking(entry.categories),
		MAX_TEXT_LENGTH - fixedLength
	)

	return [
		{
			type: 9, // Section
			components: [header],
			accessory: { type: 11, media: { url: ICON_URL } }, // Thumbnail
		},
		largeSeparator(),
		...sections.map(textDisplay),
		largeSeparator(),
		{
			type: 9, // Section
			components: [install],
			accessory: linkButton('Download', getReleaseAssetUrl(version, 'animated_java.js')),
		},
		{
			type: 1, // Action Row
			components: [
				linkButton('View on GitHub', getReleaseUrl(version)),
				linkButton('Installation Guide', INSTALL_GUIDE_URL),
			],
		},
		...footer,
	]
}

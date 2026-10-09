/**
 * Posts a release announcement to a Discord channel.
 *
 * Usage: `bun .scripts/release/announce.ts <version> [--live]`
 *
 * Without `--live`, role mentions are shown but don't ping anyone, and the message isn't
 * crossposted. Used for previews in a private test channel.
 *
 * Env: `DISCORD_BOT_TOKEN`, `DISCORD_CHANNEL_ID`, and `DISCORD_ROLE_PRERELEASE`,
 * `DISCORD_ROLE_MINOR`, `DISCORD_ROLE_PATCH`, `DISCORD_ROLE_BREAKING`.
 */
import { readFileSync } from 'node:fs'
import { buildAnnouncement } from './announcement'
import {
	type Changelog,
	type ReleasePing,
	getChangelogEntry,
	getReleasePings,
} from './releaseNotes'

const DISCORD_API = 'https://discord.com/api/v10'
const USER_AGENT = 'DiscordBot (https://github.com/Animated-Java/animated-java, 1.0)'
const CHANGELOG_PATH = './src/pluginPackage/changelog.json'
const IS_COMPONENTS_V2 = 1 << 15
const ROLE_ENV_VARS: Record<ReleasePing, string> = {
	prerelease: 'DISCORD_ROLE_PRERELEASE',
	minor: 'DISCORD_ROLE_MINOR',
	patch: 'DISCORD_ROLE_PATCH',
	breaking: 'DISCORD_ROLE_BREAKING',
}

function requireEnv(name: string) {
	const value = process.env[name]
	if (!value) throw new Error(`Missing environment variable ${name}`)
	return value
}

async function discordPost(path: string, body?: unknown) {
	const response = await fetch(DISCORD_API + path, {
		method: 'POST',
		headers: {
			Authorization: `Bot ${requireEnv('DISCORD_BOT_TOKEN')}`,
			'Content-Type': 'application/json',
			'User-Agent': USER_AGENT,
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	})
	if (!response.ok) {
		throw new Error(`POST ${path} failed: ${response.status} ${await response.text()}`)
	}
	return (await response.json()) as { id: string }
}

async function main() {
	const [version, flag] = process.argv.slice(2)
	if (!version || (flag !== undefined && flag !== '--live')) {
		throw new Error('Usage: bun .scripts/release/announce.ts <version> [--live]')
	}
	const live = flag === '--live'
	const channelId = requireEnv('DISCORD_CHANNEL_ID')

	const changelog = JSON.parse(readFileSync(CHANGELOG_PATH, 'utf-8')) as Changelog
	const entry = getChangelogEntry(changelog, version)
	const roleIds = getReleasePings(version, entry).map(ping => requireEnv(ROLE_ENV_VARS[ping]))

	const message = await discordPost(`/channels/${channelId}/messages`, {
		flags: IS_COMPONENTS_V2,
		allowed_mentions: { parse: [], roles: live ? roleIds : [] },
		components: buildAnnouncement(version, entry, roleIds),
	})
	console.log(`Posted v${version} announcement (message ${message.id}) to channel ${channelId}`)

	if (live) {
		await discordPost(`/channels/${channelId}/messages/${message.id}/crosspost`)
		console.log('Crossposted to following servers')
	}
}

await main()

import { toSmallCaps } from 'src/util/minecraftUtil'
import { type IRenderedAnimation } from '../animationRenderer'
import { JsonText, TextElement } from '../jsonText'
import { type IRenderedVariant } from '../rigRenderer'
import { TAGS } from './tags'

const TELLRAW_PREFIX = () =>
	new JsonText([
		{ text: '\n ', color: 'gray' },
		{ text: 'ᴀɴɪᴍᴀᴛᴇᴅ ᴊᴀᴠᴀ', color: '#00aced' },
		{
			text: `\n (animated_java:${Project!.animated_java.export_namespace})`,
			color: 'dark_gray',
			italic: true,
		},
		'\n → ',
	]).flatten()

const TELLRAW_SUFFIX = () => '\n'

const TELLRAW_ERROR = (errorName: string, details: TextElement) =>
	new JsonText([
		{ text: '', color: 'red' },
		TELLRAW_PREFIX(),
		'ᴇʀʀᴏʀ: ',
		{ text: errorName, underlined: true },
		'\n\n ',
		...(Array.isArray(details) ? details : [details]),
		TELLRAW_SUFFIX(),
	])

const CREATE_TELLRAW_HELP_LINK = (url: string) =>
	new JsonText([
		'\n\n ',
		!compareVersions('1.21.5', Project!.animated_java.target_minecraft_version)
			? {
					text: '▶ Learn More ◀',
					color: 'blue',
					underlined: true,
					italic: true,
					click_event: { action: 'open_url', url },
			  }
			: {
					text: '▶ Learn More ◀',
					color: 'blue',
					underlined: true,
					italic: true,
					clickEvent: { action: 'open_url', value: url },
			  },
	]).flatten()

namespace TELLRAW {
	export const RIG_OUTDATED = () =>
		TELLRAW_ERROR('Outdated Rig Instance', [
			'The instance of ',
			{ text: '$(export_namespace)', color: 'yellow' },
			' at ',
			{ text: '$(x), $(y), $(z)', color: 'yellow' },
			' was summoned using an older export of its Blueprint.',
			' It should be removed and re-summoned to ensure it functions correctly.',
			{ text: '\n\n ≡ ', color: 'white' },
			!compareVersions('1.21.5', Project!.animated_java.target_minecraft_version)
				? {
						text: toSmallCaps('Teleport to Instance'),
						click_event: {
							action: 'suggest_command',
							command: '/tp @s $(uuid)',
						},
						color: 'aqua',
						underlined: true,
				  }
				: {
						text: toSmallCaps('Teleport to Instance'),
						clickEvent: {
							action: 'suggest_command',
							value: '/tp @s $(uuid)',
						},
						color: 'aqua',
						underlined: true,
				  },
			{ text: '\n ≡ ', color: 'white' },
			!compareVersions('1.21.5', Project!.animated_java.target_minecraft_version)
				? {
						text: toSmallCaps('Remove Instance'),
						click_event: {
							action: 'suggest_command',
							command: `/execute as $(uuid) run function animated_java:$(export_namespace)/remove/this`,
						},
						color: 'aqua',
						underlined: true,
				  }
				: {
						text: toSmallCaps('Remove Instance'),
						clickEvent: {
							action: 'suggest_command',
							value: `/execute as $(uuid) run function animated_java:$(export_namespace)/remove/this`,
						},
						color: 'aqua',
						underlined: true,
				  },
		])

	export const RIG_OUTDATED_TEXT_DISPLAY = () =>
		new JsonText([
			{ text: '⚠ This rig instance is outdated! ⚠', color: 'red' },
			'\n It should be removed and re-summoned to ensure it functions correctly.',
		])
			// Because this is used as NBT in a summon command, we need to double-escape the newlines.
			.toString()
			.replaceAll('\\n', '\\\\n')

	export const FUNCTION_NOT_EXECUTED_AS_ROOT_ERROR = (functionPath: string) => {
		const hoverText = new JsonText([{ text: functionPath, color: 'yellow' }, '']).flatten()

		const exampleCommand = `/execute as @e[tag=${TAGS.PROJECT_ROOT(
			Project!.animated_java.export_namespace
		)}] run function ${functionPath}`

		return TELLRAW_ERROR('Function Not Executed as Root Entity', [
			!compareVersions('1.21.5', Project!.animated_java.target_minecraft_version)
				? {
						text: '[This Function]',
						color: 'yellow',
						hover_event: { action: 'show_text', value: hoverText },
				  }
				: {
						text: '[This Function]',
						color: 'yellow',
						hoverEvent: { action: 'show_text', contents: hoverText },
				  },
			" must be executed as the rig's root entity.",
			{
				text: '\n\n ≡ ',
				color: 'white',
				extra: [
					!compareVersions('1.21.5', Project!.animated_java.target_minecraft_version)
						? {
								text: toSmallCaps('Show Example Command'),
								color: 'aqua',
								underlined: true,
								click_event: { action: 'suggest_command', command: exampleCommand },
						  }
						: {
								text: toSmallCaps('Show Example Command'),
								color: 'aqua',
								underlined: true,
								clickEvent: { action: 'suggest_command', value: exampleCommand },
						  },
				],
			},
			CREATE_TELLRAW_HELP_LINK(
				'https://animated-java.dev/docs/rigs/controlling-a-rig-instance'
			),
		])
	}

	export const INVALID_VARIANT = (variants: Record<string, IRenderedVariant>) =>
		TELLRAW_ERROR('Invalid Variant', [
			'The variant ',
			{ nbt: 'args.variant', storage: 'aj:temp', color: 'yellow' },
			' does not exist.',
			'\n ',
			{ text: ' ≡ ', color: 'white' },
			{ text: 'Available Variants:', color: 'green' },
			...Object.values(variants).map(variant =>
				new JsonText([
					{ text: '\n ', color: 'gray' },
					'\\s\\s\\s',
					' ● ',
					{ text: variant.name, color: 'yellow' },
				]).flatten()
			),
		])

	export const FRAME_CANNOT_BE_NEGATIVE = () =>
		TELLRAW_ERROR('Frame cannot be negative', [
			{ text: 'frame', color: 'yellow' },
			{ text: ' must be a non-negative integer.' },
		])

	export const INVALID_ANIMATION = (animations: IRenderedAnimation[]) =>
		TELLRAW_ERROR('Invalid Animation', [
			'The animation ',
			{ nbt: 'args.animation', storage: 'aj:temp', color: 'yellow' },
			' does not exist.',
			'\n ',
			{ text: ' ≡ ', color: 'white' },
			{ text: 'Available Animations:', color: 'green' },
			...animations.map(anim =>
				new JsonText([
					{ text: '\n ', color: 'gray' },
					'\\s\\s\\s',
					' ● ',
					{ text: anim.storage_name, color: 'yellow' },
				]).flatten()
			),
		])

	export const NO_VARIANTS = () =>
		TELLRAW_ERROR('No Variants', ['This Blueprint has no variants to switch between.'])

	export const INVALID_VERSION = () =>
		TELLRAW_ERROR('Invalid Minecraft Version', [
			'Attempted to load an Animated Java Data Pack that was exported for ',
			{
				text: `Minecraft ${Project!.animated_java.target_minecraft_version}`,
				color: 'aqua',
			},
			' in the wrong version!',
			'\n Please ensure that the data pack is loaded in the correct version, or that your Blueprint settings are configured to target the correct version(s) of Minecraft.',
		])

	export const UNINSTALL = () =>
		new JsonText([
			TELLRAW_PREFIX(),
			[
				{ text: 'Successfully uninstalled ', color: 'green' },
				{ text: Project!.animated_java.export_namespace, color: 'yellow' },
				{ text: '!' },
				{
					text: '\n If you have exported multiple times, you may have to remove objectives from previous exports manually, as Animated Java only knows about the objectives from the most recent export.',
					color: 'gray',
					italic: true,
				},
			],
			TELLRAW_SUFFIX(),
		])

	export const ARGUMENT_CANNOT_BE_EMPTY = (name: string) =>
		TELLRAW_ERROR('Argument Cannot Be Empty', [
			'Argument ',
			{ text: name, color: 'yellow' },
			{ text: ' cannot be an empty string.' },
		])

	export const LOCATOR_NOT_FOUND = () =>
		TELLRAW_ERROR('Locator Not Found', [
			'Locator ',
			{ nbt: 'args.name', storage: 'aj:temp', color: 'aqua' },
			' not found!',
			'\n Please ensure that the name is spelled correctly.',
		])

	export const LOCATOR_ENTITY_NOT_FOUND = () =>
		TELLRAW_ERROR('Locator Not Found', [
			'Locator ',
			{ nbt: 'args.name', storage: 'aj:temp', color: 'aqua' },
			' does not exist!',
			{ text: '\n Please ensure that the name is spelled correctly, and ' },
			{ text: '"Use Entity"', color: 'yellow' },
			" is enabled in the locator's config.",
		])

	export const LOCATOR_COMMAND_FAILED_TO_EXECUTE = () =>
		TELLRAW_ERROR('Failed to Execute Command as Locator', [
			'Failed to execute command ',
			{ nbt: 'args.command', storage: 'aj:temp', color: 'yellow' },
			' as Locator ',
			{ nbt: 'args.name', storage: 'aj:temp', color: 'aqua' },
			'.',
			'\n Please ensure the command is valid.',
		])

	export const CAMERA_ENTITY_NOT_FOUND = () =>
		TELLRAW_ERROR('Camera Not Found', [
			'Camera ',
			{ nbt: 'args.name', storage: 'aj:temp', color: 'aqua' },
			' does not exist!',
			'\n Please ensure that its name is spelled correctly.',
		])

	export const CAMERA_COMMAND_FAILED_TO_EXECUTE = () =>
		TELLRAW_ERROR('Failed to Execute Command as Camera', [
			'Failed to execute command ',
			{ nbt: 'args.command', storage: 'aj:temp', color: 'yellow' },
			' as Camera ',
			{ nbt: 'args.name', storage: 'aj:temp', color: 'aqua' },
			'.',
			'\n Please ensure the command is valid.',
		])

	export const AUTO_UPDATE_RIG_ORIENTATION_MOVE_WARNING = () =>
		TELLRAW_ERROR('Called Move Function while Auto Update Rig Orientation is Enabled', [
			'The ',
			{ text: 'move', color: 'yellow' },
			' function cannot be called while ',
			{ text: 'Auto Update Rig Orientation', color: 'yellow' },
			' is enabled.',
			'\n Please either disable ',
			{ text: 'Auto Update Rig Orientation', color: 'yellow' },
			' or avoid calling the ',
			{ text: 'move', color: 'yellow' },
			' function.',
		])
}

export default TELLRAW

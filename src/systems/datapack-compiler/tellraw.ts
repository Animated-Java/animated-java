import type { IRenderedAnimation } from '../animation-renderer'
import { JsonText } from '../minecraft-temp/jsonText'
import type { IRenderedVariant } from '../rig-renderer'
import { OBJECTIVES } from './objectives'

export namespace TELLRAW {
	export const PREFIX = () =>
		new JsonText([
			{ text: '\n[', color: 'gray' },
			{ text: 'AJ', color: 'aqua' },
			'] ',
			[{ text: '(from ', color: 'gray', italic: true }, Project!.animated_java.id, ')'],
			' -> ',
		])

	export const ERROR_PREFIX = () =>
		new JsonText([PREFIX(), { text: 'ERROR: ', color: 'red' }, '\n '])

	export const SUFFIX = () => new JsonText(['\n'])

	export const LEARN_MORE_LINK = (url: string) =>
		new JsonText([
			'\n ',
			{
				text: 'Click here to learn more',
				color: 'blue',
				underlined: true,
				italic: true,
				clickEvent: { action: 'open_url', value: url },
			},
		])

	export const RIG_OUTDATED = () =>
		new JsonText([
			'',
			ERROR_PREFIX(),
			{ text: 'The ', color: 'red' },
			{ text: Project!.animated_java.id, color: 'yellow' },
			{ text: ' rig instance at', color: 'red' },
			[
				{ text: ' [', color: 'yellow' },
				{ score: { name: '#this.x', objective: OBJECTIVES.I() } },
				', ',
				{ score: { name: '#this.y', objective: OBJECTIVES.I() } },
				', ',
				{ score: { name: '#this.z', objective: OBJECTIVES.I() } },
				']',
			],
			{
				text: ' is outdated! It will not function correctly and should be removed or re-summoned.',
				color: 'red',
			},
			'\n ',
			{
				text: '[Click Here to Teleport to the Rig Instance]',
				clickEvent: {
					action: 'suggest_command',
					value: '/tp @s $(x) $(y) $(z)',
				},
				color: 'aqua',
				underlined: true,
			},
			SUFFIX(),
		])

	export const RIG_OUTDATED_TEXT_DISPLAY = () =>
		new JsonText([
			'',
			{
				text: 'This rig instance is outdated!\\nIt will not function correctly and should be removed or re-summoned.',
				color: 'red',
			},
		])

	export const FUNCTION_NOT_EXECUTED_AS_ROOT_ERROR = (functionName: string) =>
		new JsonText([
			'',
			ERROR_PREFIX(),
			{
				text: 'This function',
				color: 'blue',
				underlined: true,
				hoverEvent: {
					action: 'show_text',
					contents: [{ text: functionName, color: 'yellow' }],
				},
			},
			{ text: " must be executed as the rig's root entity.", color: 'red' },
			'\n',
			LEARN_MORE_LINK(
				'https://animated-java.dev/docs/exported-rigs/controlling-a-rig-instance'
			),
			SUFFIX(),
		])

	// Summon Function
	export const VARIANT_CANNOT_BE_EMPTY = () =>
		new JsonText([
			'',
			ERROR_PREFIX(),
			{ text: 'variant', color: 'yellow' },
			{ text: ' cannot be an empty string.', color: 'red' },
			SUFFIX(),
		])

	export const INVALID_VARIANT = (
		variantName: string,
		variants: Record<string, IRenderedVariant>
	) =>
		new JsonText([
			'',
			ERROR_PREFIX(),
			{ text: 'The variant ', color: 'red' },
			{ text: variantName, color: 'yellow' },
			{ text: ' does not exist.', color: 'red' },
			'\n ',
			{ text: ' ≡ ', color: 'white' },
			{ text: 'Available Variants:', color: 'green' },
			...Object.values(variants).map(
				variant =>
					new JsonText([
						'\n ',
						' ',
						' ',
						{ text: ' ● ', color: 'gray' },
						{ text: variant.name, color: 'yellow' },
					])
			),
			SUFFIX(),
		])

	export const ANIMATION_CANNOT_BE_EMPTY = () =>
		new JsonText([
			'',
			ERROR_PREFIX(),
			{ text: 'animation', color: 'yellow' },
			{ text: ' cannot be an empty string.', color: 'red' },
			SUFFIX(),
		])

	export const FRAME_CANNOT_BE_NEGATIVE = () =>
		new JsonText([
			'',
			ERROR_PREFIX(),
			{ text: 'frame', color: 'yellow' },
			{ text: ' must be a non-negative integer.', color: 'red' },
			SUFFIX(),
		])

	export const INVALID_ANIMATION = (animationName: string, animations: IRenderedAnimation[]) =>
		new JsonText([
			'',
			ERROR_PREFIX(),
			{ text: 'The animation ', color: 'red' },
			{ text: animationName, color: 'yellow' },
			{ text: ' does not exist.', color: 'red' },
			'\n ',
			{ text: ' ≡ ', color: 'white' },
			{ text: 'Available Animations:', color: 'green' },
			...animations.map(
				anim =>
					new JsonText([
						'\n ',
						' ',
						' ',
						{ text: ' ● ', color: 'gray' },
						{ text: anim.safe_name, color: 'yellow' },
					])
			),
			SUFFIX(),
		])

	export const NO_VARIANTS = () =>
		new JsonText([
			'',
			ERROR_PREFIX(),
			{ text: 'No variants are available.', color: 'red' },
			SUFFIX(),
		])

	export const INVALID_VERSION = () =>
		new JsonText([
			ERROR_PREFIX(),
			[
				{
					text: 'Attempting to load an Animated Java Data Pack that was exported for ',
					color: 'red',
				},
				{
					text: `Minecraft ${Project!.animated_java.target_minecraft_version}`,
					color: 'aqua',
				},
				{ text: ' in the wrong version!', color: 'red' },
				{
					text: '\n Please ensure that the data pack is loaded in the correct version, or that your blueprint settings are configured to target the correct version(s) of Minecraft.',
					color: 'yellow',
				},
			],
			SUFFIX(),
		])
}

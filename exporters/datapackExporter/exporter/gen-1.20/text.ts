import { Globals as G } from './globals'

export function loadJSONText() {
	const { JsonText } = AnimatedJava.API

	const errorMustBeRunAsRoot = new JsonText([
		'',
		{ text: '[' },
		{ text: 'Animated Java', color: 'aqua' },
		{ text: '] ' },
		{ text: 'ERROR ☠', color: 'red' },
		{ text: ' > ', color: 'gray' },
		[
			{ text: 'The function', color: 'yellow' },
			{ text: ' %s ', color: 'blue' },
			{ text: 'must be run' },
			{ text: ' as ', color: 'red' },
			{ text: 'the root entity!' },
		],
	])

	const errorOutOfDateRig = new JsonText([
		'',
		{ text: '[' },
		{ text: 'Animated Java', color: 'aqua' },
		{ text: '] ' },
		[
			{ text: 'ERROR ☠', color: 'red' },
			{ text: ' > ', color: 'gray' },
			{ text: 'An existing rig is out-of-date!' },
			{
				text: ' Please re-summon the highlighted rig to update it to the newly exported version.',
				color: 'yellow',
			},
		],
	])

	const uninstallMessage = new JsonText([
		'',
		{ text: '[' },
		{ text: 'Animated Java', color: 'aqua' },
		{ text: '] ' },
		[
			{ text: 'INFO ℹ', color: 'green' },
			{ text: ' > ', color: 'gray' },
			{ text: `The ${G.PROJECT_NAME} Rig has been uninstalled successfully.\n` },
			{
				text: `Please remove the Rig's functions from the datapack before reloading.`,
				color: 'gray',
			},
		],
	])

	return { errorMustBeRunAsRoot, errorOutOfDateRig, uninstallMessage }
}

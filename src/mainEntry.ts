import { tl } from './util/intl'
import type * as aj from './animatedJava'

import './lifecycle'
import './rotationSnap'
import './ui/panel/variants_manager'
import './ui/dialogs/settings'
import { bus } from './util/bus'
import { store } from './util/store'
import { ERROR } from './util/errors'
import EVENTS from './constants/events'
import { CustomError } from './util/customError'
import { CustomAction } from './util/customAction'
import { format as modelFormat } from './modelFormat'
import { renderAnimation } from './animationRenderer'
import { DefaultSettings, settings } from './settings'
// import { makeArmorStandModel } from './makeArmorStandModel'

import { exportPredicate, exportRigModels, exportTransparentTexture } from './exporting'

import {
	computeElements,
	computeModels,
	computeVariantTextureOverrides,
	computeBones,
	computeVariantModels,
	computeScaleModels,
} from './modelComputation'

const errorMessages = [
	`Uh oh!`,
	`Time to fire up the ol' debugger!`,
	`Your armor stands are sad :(`,
	`Ok, who pushed the big red button?`,
	`Skill Issue.`,
	`Too bad, So Sad`,
	`You have how many elements!?`,
	`I'll export successfully some day!`,
	`When I grow up, I wanna be just like Blender!`,
	`Wow, Epic fail.`,
	`Should'a seen that one comming...`,
	`It's all Jannis' fault! :(`,
	`Snaviewavie did an oopsie poopsie x3`,
	`We to a little trolling`,
	`execute run execute run execute run execute run say This is fine.`,
	`This is why we can't have nice things. :(`,
	`Have you tried turning it off and on again?`,
	`What if I put my command block next to yours? Haha just kidding... Unless?`,
	`If at first you don't succeed, Try, try again!`,
	`B:01010111 01100101 00100000 01100100 01101111 00100000 01100001 00100000 01101100 01101001 01110100 01110100 01101100 01100101 00100000 01110100 01110010 01101111 01101100 01101100 01101001 01101110 01100111`,
	`FetchBot would like to know your location: [Allow] [Deny]`,
	`I've decided to stop working for today. Try again tomorrow!`,
	`Every time you see this error message, a developer vanishes in a puff of binary.`,
	`Maybe we shouldn't press that button...`,
	`Not to cause any alarm, but you may have just launched all the nukes...`,
	`"Flavor Text"? I've never tasted text before...`,
	`<Access Denied>`,
	`( ͡° ͜ʖ ͡°)`,
	`.;,,,;.`,
	`That's a nice model you have there, it'd be a shame if something happend to it...`,
	`Some day you'll learn. But until then, I control the cheese`,
	`Please deposit 5 coins!`,
	`errorMessages[-1] >>> undefined`,
	`<a href="https://youtu.be/dQw4w9WgXcQ">Click here to find a solution!</a>`,
	`<img src="https://i.kym-cdn.com/photos/images/original/000/296/199/9ff.gif" alt="roflcopter">`,
	`Failed to find global 'pandemic'`,
]

function getRandomErrorMessage() {
	const index = Math.round(Math.random() * (errorMessages.length - 1))
	return errorMessages[index]
}

function showErrorDialog(e: CustomError | any) {
	new Dialog(
		Object.assign(
			{
				id: 'animatedJava.dialogs.miscError',
				title: tl('animatedJava.dialogs.errors.misc.title'),
				lines: [
					tl(
						'animatedJava.dialogs.errors.misc.body',
						{
							buildID: process.env.BUILD_ID,
							errorMessage: e.options ? e.options.message : e.message,
							randomErrorMessage: getRandomErrorMessage(),
							errorStack: e.stack,
							discordLink: process.env.DISCORD_LINK,
							githubLink: process.env.GITHUB_ISSUES_LINK,
							pluginVersion: process.env.PLUGIN_VERSION,
						},
						true
					),
				],
				width: 1024,
				singleButton: true,
			},
			e.options?.dialog || {}
		)
	).show()
}

function onBuildError(e: any) {
	ANIMATED_JAVA.exportInProgress = false
	Blockbench.setProgress(0)
	if (e instanceof CustomError) {
		if (e.options.silent) {
			Blockbench.showQuickMessage(tl('animatedJava.popups.exportCancelled'))
			console.error('Silent Error:', e.stack)
			throw e
		}
		console.error('Dialog Error:')
		showErrorDialog(e)
	} else {
		console.error('Unexpected Error:')
		showErrorDialog(e)
	}
}

export const BuildModel = (callback: any, options: any) => {
	if (!ANIMATED_JAVA.exportInProgress) {
		ANIMATED_JAVA.exportInProgress = true
		computeAnimationData(callback, options)
			.then(
				() => {
					ANIMATED_JAVA.exportInProgress = false
				},
				e => onBuildError(e)
			)
			.catch(e => onBuildError(e))
	} else {
		Blockbench.showQuickMessage(tl('animatedJava.popups.exportInProgress'))
		ERROR.ANIMATED_JAVA_BUSY()
	}
}

function throwSkillIssue() {
	throw new CustomError('Skill Issue', {
		showDialog: true,
		dialog: {
			id: 'animatedJava.dialogs.errors.skillIssue',
			title: 'Smells like, Skill Issue',
			lines: ['You have a skill issue. Too bad!'],
			width: 128,
			singleButton: true,
		},
	})
}

async function computeAnimationData(callback: (data: any) => any, options: any) {
	console.groupCollapsed('Compute Animation Data')

	// throwSkillIssue()
	// throw new Error('test error')

	if (!settings.animatedJava.predicateFilePath) {
		throw new CustomError('Predicate File Path Undefined Error', {
			showDialog: true,
			dialog: {
				id: 'animatedJava.dialogs.errors.predicateFilePathUndefined',
				title: tl('animatedJava.dialogs.errors.predicateFilePathUndefined.title'),
				lines: [tl('animatedJava.dialogs.errors.predicateFilePathUndefined.body')],
				width: 256,
			},
		})
	}
	if (!settings.animatedJava.rigModelsExportFolder) {
		throw new CustomError('Rig Model Exporter Folder Undefined', {
			showDialog: true,
			dialog: {
				id: 'animatedJava.dialogs.errors.rigModelsExportFolderUndefined',
				title: tl('animatedJava.dialogs.errors.rigModelsExportFolderUndefined.title'),
				lines: [tl('animatedJava.dialogs.errors.rigModelsExportFolderUndefined.body')],
				width: 256,
			},
		})
	}

	const animations = (await renderAnimation(options)) as aj.Animations
	const cubeData: aj.CubeData = computeElements()
	const models: aj.ModelObject = await computeModels(cubeData)
	const variantTextureOverrides = computeVariantTextureOverrides(
		models
	) as aj.VariantTextureOverrides
	const bones = computeBones(models, animations) as aj.BoneObject
	// const [variantModels, variantTouchedModels] = await computeVariantModels(models, variantTextureOverrides)
	const scaleModels = computeScaleModels(bones)
	const variants = (await computeVariantModels(models, scaleModels, variantTextureOverrides)) as {
		variantModels: aj.VariantModels
		variantTouchedModels: aj.variantTouchedModels
	}

	// const flatVariantModels = {}
	// Object.values(variantModels).forEach(variant => Object.entries(variant).forEach(([k,v]) => flatVariantModels[k] = v))
	// console.log('Flat Variant Models:', flatVariantModels)

	await exportRigModels(models, variants.variantModels, scaleModels)
	await exportPredicate(models, variants.variantModels, scaleModels, settings.animatedJava)
	if (settings.animatedJava.transparentTexturePath) {
		await exportTransparentTexture()
	}

	const data = {
		settings: settings.toObject() as aj.GlobalSettings,
		cubeData,
		bones,
		models,
		scaleModels,
		variantTextureOverrides,
		variantModels: variants.variantModels,
		variantTouchedModels: variants.variantTouchedModels,
		animations,
	} as aj.ExportData
	console.groupEnd()
	console.groupCollapsed('Exporter Output')
	await callback(data)
	console.groupEnd()
}

import './pluginDefinitions'
import { show_settings } from './ui/dialogs/settings'
import { show_about } from './ui/dialogs/about'

const menu: any = new BarMenu('animated_java', [], () => Format.id === modelFormat.id)
menu.label.style.display = 'none'
document.querySelector('#menu_bar').appendChild(menu.label)
// @ts-ignore
Blockbench.on('select_project', () => {
	queueMicrotask(() => {
		console.log('selected', Format.id !== modelFormat.id)
		menu.label.style.display = Format.id !== modelFormat.id ? 'none' : 'inline-block'
	})
})
// @ts-ignore
Blockbench.on('unselect_project', () => {
	menu.label.style.display = 'none'
})
// @ts-ignore
import logo from './assets/Animated_Java_2022.svg'
menu.label.innerHTML = tl('animatedJava.menubar.dropdown')
let img = document.createElement('img')
img.src = logo
img.width = 16
img.height = 16
img.style.position = 'relative'
img.style.top = '2px'
img.style.borderRadius = '8px'
img.style.marginRight = '5px'
menu.label.prepend(img)
MenuBar.addAction(
	CustomAction('animated_java_settings', {
		icon: 'settings',
		category: 'animated_java',
		name: tl('animatedJava.menubar.settings'),
		condition: () => modelFormat.id === Format.id,
		click: function () {
			show_settings()
		},
	}),
	'animated_java'
)
MenuBar.addAction(
	{
		// @ts-ignore
		name: tl('animatedJava.menubar.export'),
		id: 'animatedJava.export',
		icon: 'insert_drive_file',
		condition: () => modelFormat.id === Format.id,
		click: () => {
			// Call the selected exporter.
			// @ts-ignore
			const exporter = settings.animatedJava.exporter
			if (exporter) {
				store.getStore('exporters').get(exporter)()
			} else {
				Blockbench.showQuickMessage(tl('animatedJava.popups.noExporterSelected'))
			}
		},
		keybind: new Keybind({
			key: 120, // f9
		}),
	},
	'animated_java'
)
MenuBar.addAction(
	CustomAction('animated_java_about', {
		icon: 'help',
		category: 'animated_java',
		name: tl('animatedJava.menubar.about'),
		condition: () => modelFormat.id === Format.id,
		click: function () {
			show_about()
		},
	}),
	'animated_java'
)
MenuBar.update()
const cb = () => {
	store.set('variants', { default: {} })
	settings.update(DefaultSettings, true)
	//@ts-ignore;
	Project.UUID = globalThis.guid()
	bus.dispatch(EVENTS.LIFECYCLE.LOAD_MODEL, {})
}
Blockbench.on('new_project', cb)
bus.on(EVENTS.LIFECYCLE.CLEANUP, () => {
	menu.label.remove()
	// @ts-ignore
	Blockbench.removeListener('new_project', cb)
})

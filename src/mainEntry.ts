import { tl, intl } from './util/intl'
// @ts-ignore
import lang_cz from './lang/cz.yaml'
intl.register('cz', lang_cz)
// @ts-ignore
import lang_de from './lang/de.yaml'
intl.register('de', lang_de)
// @ts-ignore
import lang_en from './lang/en.yaml'
intl.register('en', lang_en)
// @ts-ignore
import lang_es from './lang/es.yaml'
intl.register('es', lang_es)
// @ts-ignore
import lang_fr from './lang/fr.yaml'
intl.register('fr', lang_fr)
// @ts-ignore
import lang_it from './lang/it.yaml'
intl.register('it', lang_it)
// @ts-ignore
import lang_ja from './lang/ja.yaml'
intl.register('ja', lang_ja)
// @ts-ignore
import lang_ko from './lang/ko.yaml'
intl.register('ko', lang_ko)
// @ts-ignore
import lang_nl from './lang/nl.yaml'
intl.register('nl', lang_nl)
// @ts-ignore
import lang_pl from './lang/pl.yaml'
intl.register('pl', lang_pl)
// @ts-ignore
import lang_pt from './lang/pt.yaml'
intl.register('pt', lang_pt)
// @ts-ignore
import lang_ru from './lang/ru.yaml'
intl.register('ru', lang_ru)
// @ts-ignore
import lang_sv from './lang/sv.yaml'
intl.register('sv', lang_sv)
// @ts-ignore
import lang_zh from './lang/zh.yaml'
intl.register('zh', lang_zh)
// @ts-ignore
import lang_zh_tw from './lang/zh_tw.yaml'
intl.register('zh_tw', lang_zh_tw)
import type * as aj from './animatedJava'

import './lifecycle'
import './rotationSnap'
import './ui/panel/states'
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

import {
	exportPredicate,
	exportRigModels,
	exportTransparentTexture,
} from './exporting'

import {
	computeElements,
	computeModels,
	computeVariantTextureOverrides,
	computeBones,
	computeVariantModels,
	computeScaleModels,
} from './modelComputation'

export const BuildModel = (callback: any, options: any) => {
	if (!ANIMATED_JAVA.exportInProgress) {
		ANIMATED_JAVA.exportInProgress = true
		computeAnimationData(callback, options)
			.then(() => {
				ANIMATED_JAVA.exportInProgress = false
			})
			.catch((e) => {
				ANIMATED_JAVA.exportInProgress = false
				Blockbench.setProgress(0)
				if (
					e instanceof CustomError &&
					e.options.intentional &&
					e.options.silent
				) {
					// @ts-ignore
					Blockbench.showQuickMessage(
						tl('animatedJava.popups.exportCancelled')
					)
					console.log('Intentional Error:', e.message)
					throw e
				} else {
					console.log('Unknown Error:')
					throw e
				}
			})
	} else {
		Blockbench.showQuickMessage(tl('animatedJava.popups.exportInProgress'))
		ERROR.ANIMATED_JAVA_BUSY()
	}
}

async function computeAnimationData(
	callback: (data: any) => any,
	options: any
) {
	console.groupCollapsed('Compute Animation Data')

	if (!settings.animatedJava.predicateFilePath) {
		throw new CustomError('Predicate File Path Undefined Error', {
			intentional: true,
			dialog: {
				id: 'animatedJava.dialogs.errors.predicateFilePathUndefined',
				title: tl(
					'animatedJava.dialogs.errors.predicateFilePathUndefined.title'
				),
				lines: [
					tl(
						'animatedJava.dialogs.errors.predicateFilePathUndefined.body'
					),
				],
				width: 256,
			},
		})
	}
	if (!settings.animatedJava.rigModelsExportFolder) {
		throw new CustomError('Rig Model Exporter Folder Undefined', {
			intentional: true,
			dialog: {
				id: 'animatedJava.dialogs.errors.rigModelsExportFolderUndefined',
				title: tl(
					'animatedJava.dialogs.errors.rigModelsExportFolderUndefined.title'
				),
				lines: [
					tl(
						'animatedJava.dialogs.errors.rigModelsExportFolderUndefined.body'
					),
				],
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
	const variants = (await computeVariantModels(
		models,
		scaleModels,
		variantTextureOverrides
	)) as {
		variantModels: aj.VariantModels
		variantTouchedModels: aj.variantTouchedModels
	}

	// const flatVariantModels = {}
	// Object.values(variantModels).forEach(variant => Object.entries(variant).forEach(([k,v]) => flatVariantModels[k] = v))
	// console.log('Flat Variant Models:', flatVariantModels)

	await exportRigModels(models, variants.variantModels, scaleModels)
	await exportPredicate(
		models,
		variants.variantModels,
		scaleModels,
		settings.animatedJava
	)
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

const menu: any = new BarMenu(
	'animated_java',
	[],
	() => Format.id === modelFormat.id
)
menu.label.style.display = 'none'
document.querySelector('#menu_bar').appendChild(menu.label)
// @ts-ignore
Blockbench.on('select_project', () => {
	queueMicrotask(() => {
		console.log('selected', Format.id !== modelFormat.id)
		menu.label.style.display =
			Format.id !== modelFormat.id ? 'none' : 'inline-block'
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
				Blockbench.showQuickMessage(
					tl('animatedJava.popups.noExporterSelected')
				)
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
	store.set('states', { default: {} })
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

import * as aj from './animatedJava'

import './lifecycle'
import './rotationSnap'
import { format } from './modelFormat'
import { DefaultSettings, settings } from './settings'
import { CustomError } from './util/customError'
import { ERROR } from './util/errors'
import { store } from './util/store'
import { translate } from './util/intl'
import { bus } from './util/bus'
import { CustomAction } from './util/customAction'
import './ui/panels/states'
import './ui/dialogs/settings'
import EVENTS from './constants/events'
import { renderAnimation } from './animationRenderer'

// declare var settings: aj.Settings

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
} from './modelComputation'

import { intl } from './util/intl'
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
import { makeArmorStandModel } from './makeArmorStandModel'

let F_IS_BUILDING = false
export const BuildModel = (callback: any, options: any) => {
	if (!F_IS_BUILDING) {
		F_IS_BUILDING = true
		computeAnimationData(callback, options)
			.then(() => {
				F_IS_BUILDING = false
			})
			.catch((e) => {
				if (e.options && !e.options.silent) {
					new Dialog(
						e.options || {
							title: 'An Error Occurred',
							lines: [
								`<p>An error has occurred, see below for more info.</p>`,
								`<p>build:${process.env.BUILD_ID}</p>`,
								`<hr/>`,
								`<p>please send the error log below to the devs alongside the model file in its current state if possible.</p>`,
								`<textarea>` +
									`BUILD: ${process.env.BUILD_ID}\n` +
									`ERROR:\n` +
									e.stack +
									`</textarea>`,
							],
						}
					).show()
				}

				F_IS_BUILDING = false
				Blockbench.setProgress(0)
				throw e
			})
	} else {
		Blockbench.showQuickMessage(translate('error.build_in_progress'))
		ERROR.ANIMATED_JAVA_BUSY()
	}
}

async function computeAnimationData(
	callback: (data: any) => any,
	options: any
) {
	console.groupCollapsed('Compute Animation Data')

	if (!settings.animatedJava.predicateFilePath) {
		let d = new Dialog({
			title: translate(
				'animatedJava.popup.error.predicateFilePathUndefined.title'
			),
			id: '',
			lines: translate(
				'animatedJava.popup.error.predicateFilePathUndefined.body'
			)
				.split('\n')
				.map((line: string) => `<p>${line}</p>`),
			onConfirm() {
				d.hide()
			},
			onCancel() {
				d.hide()
			},
		}).show()
		throw new CustomError({ silent: true })
	}
	if (!settings.animatedJava.rigModelsExportFolder) {
		let d = new Dialog({
			title: translate(
				'animatedJava.popup.error.rigModelsExportFolder.title'
			),
			id: '',
			lines: translate(
				'animatedJava.popup.error.rigModelsExportFolder.body'
			)
				.split('\n')
				.map((line: string) => `<p>${line}</p>`),
			onConfirm() {
				d.hide()
			},
			onCancel() {
				d.hide()
			},
		}).show()
		throw new CustomError({ silent: true })
	}

	const animations = (await renderAnimation(options)) as aj.Animations
	const cubeData: aj.CubeData = computeElements()
	const models: aj.ModelObject = await computeModels(cubeData)
	const variantTextureOverrides = computeVariantTextureOverrides(
		models
	) as aj.VariantTextureOverrides
	const bones = computeBones(models, animations) as aj.BoneObject
	// const [variantModels, variantTouchedModels] = await computeVariantModels(models, variantTextureOverrides)
	const variants = (await computeVariantModels(
		models,
		variantTextureOverrides
	)) as {
		variantModels: aj.VariantModels
		variantTouchedModels: aj.variantTouchedModels
	}

	// const flatVariantModels = {}
	// Object.values(variantModels).forEach(variant => Object.entries(variant).forEach(([k,v]) => flatVariantModels[k] = v))
	// console.log('Flat Variant Models:', flatVariantModels)

	await exportRigModels(models, variants.variantModels)
	await exportPredicate(models, variants.variantModels, settings.animatedJava)
	if (settings.animatedJava.transparentTexturePath) {
		await exportTransparentTexture()
	}

	const data = {
		settings: settings.toObject() as aj.Settings,
		cubeData,
		bones,
		models,
		variantTextureOverrides,
		variantModels: variants.variantModels,
		variantTouchedModels: variants.variantTouchedModels,
		// flatVariantModels,
		animations,
	}
	console.groupEnd()
	console.groupCollapsed('Exporter Output')
	await callback(data)
	console.groupEnd()
}

import './pluginDefinitions'
import { show_settings } from './ui/dialogs/settings'

const menu: any = new BarMenu(
	'animated_java',
	[],
	() => Format.id === format.id
)
menu.label.style.display = 'none'
document.querySelector('#menu_bar').appendChild(menu.label)
// @ts-ignore
Blockbench.on('select_project', () => {
	queueMicrotask(() => {
		console.log('selected', Format.id !== format.id)
		menu.label.style.display =
			Format.id !== format.id ? 'none' : 'inline-block'
	})
})
// @ts-ignore
Blockbench.on('unselect_project', () => {
	menu.label.style.display = 'none'
})
menu.label.innerHTML = translate('animatedJava.menubar.dropdown.name')
MenuBar.addAction(
	CustomAction('animated_java_settings', {
		icon: 'settings',
		category: 'animated_java',
		name: translate('animatedJava.menubar.settings.name'),
		condition: () => format.id === Format.id,
		click: function () {
			show_settings()
		},
	}),
	'animated_java'
)
MenuBar.addAction(
	{
		// @ts-ignore
		name: translate('animatedJava.menubar.export.name'),
		id: 'animatedJava_export',
		icon: 'insert_drive_file',
		condition: () => format.id === Format.id,
		click: () => {
			// Call the selected exporter.
			// @ts-ignore
			const exporter = settings.animatedJava.exporter
			if (exporter) {
				store.getStore('exporters').get(exporter)()
			} else {
				Blockbench.showQuickMessage(
					translate(
						'animatedJava.popup.quickMessage.noExporterSelected'
					)
				)
			}
		},
	},
	'animated_java'
)
MenuBar.update()
const cb = () => {
	store.set('states', { default: {} })
	settings.update(DefaultSettings, true)
	bus.dispatch(EVENTS.LIFECYCLE.LOAD_MODEL, {})
}
Blockbench.on('new_project', cb)
bus.on(EVENTS.LIFECYCLE.CLEANUP, () => {
	menu.label.remove()
	// @ts-ignore
	Blockbench.removeListener('new_project', cb)
})

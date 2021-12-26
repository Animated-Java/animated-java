import fs from 'fs'
import path, { resolve } from 'path'
import { settings } from './settings'
import { mkdir } from './util'
import { CustomError } from './util/CustomError'
import { translate } from './util/intl'
// import { safeFunctionName } from './util'
import transparent from './assets/transparent.png'

// Exports the model.json rig files
export async function exportRigModels(models, variantModels) {
	console.groupCollapsed('Export Rig Models')
	const metaPath = path.join(
		settings.animatedJava.rigModelsExportFolder,
		'.aj_meta'
	)

	if (!fs.existsSync(metaPath)) {
		await new Promise((resolve, reject) => {
			let d = new Dialog({
				title: translate(
					'animatedJava.popup.warning.rigFolderUnused.title'
				),
				lines: [
					`<p>${translate(
						'animatedJava.popup.warning.rigFolderUnused.body1'
					)}</p>`,
					`<p>${translate(
						'animatedJava.popup.warning.rigFolderUnused.body2'
					)}</p>`,
				],
				onConfirm() {
					d.hide()
					Blockbench.writeFile(metaPath, {
						content: Project.UUID,
					})
					resolve()
				},
				onCancel() {
					d.hide()
					reject(new CustomError({ silent: true }))
				},
			}).show()
		})
	} else if (fs.readFileSync(metaPath, 'utf-8') !== Project.UUID) {
		await new Promise((resolve, reject) => {
			let d = new Dialog({
				title: translate(
					'animatedJava.popup.error.rigFolderAlreadyUsedByOther.title'
				),
				lines: [
					`<p>${translate(
						'animatedJava.popup.error.rigFolderAlreadyUsedByOther.body1'
					)}</p>`,
					`<p>${translate(
						'animatedJava.popup.error.rigFolderAlreadyUsedByOther.body2'
					)}</p>`,
				],
				onConfirm() {
					d.hide()
					Blockbench.writeFile(metaPath, {
						content: Project.UUID,
					})
					resolve()
				},
				onCancel() {
					d.hide()
					reject(new CustomError({ silent: true }))
				},
			}).show()
		})
	}

	console.log('Export Models:', models)
	console.group('Details')

	for (const [name, model] of Object.entries(models)) {
		// Get the model's file path
		const modelFilePath = path.join(
			settings.animatedJava.rigModelsExportFolder,
			name + '.json'
		)
		console.log('Exporting Model', modelFilePath, model.elements)
		// Export the model
		const modelJSON = {
			__credit:
				'Generated using Animated Java (https://animated-java.dev/)',
			...model,
			aj: undefined,
		}
		Blockbench.writeFile(modelFilePath, {
			content: autoStringify(modelJSON),
		})
	}
	console.groupEnd('Details')

	console.log('Export Variant Models:', variantModels)
	console.group('Details')

	for (const [variantName, variant] of Object.entries(variantModels)) {
		const variantFolderPath = path.join(
			settings.animatedJava.rigModelsExportFolder,
			variantName
		)
		mkdir(variantFolderPath, { recursive: true })

		for (const [modelName, model] of Object.entries(variant)) {
			// Get the model's file path
			const modelFilePath = path.join(
				variantFolderPath,
				`${modelName}.json`
			)
			console.log('Exporting Model', modelFilePath, model.elements)
			// Export the model
			const modelJSON = {
				__credit:
					'Generated using Animated Java (https://animated-java.dev/)',
				...model,
				aj: undefined,
			}
			Blockbench.writeFile(modelFilePath, {
				content: autoStringify(modelJSON),
			})
		}
	}
	console.groupEnd('Details')

	console.groupEnd('Export Rig Models')
}

function getMCPath(raw) {
	let list = raw.split(path.sep)
	console.log(list)
	const index = list.indexOf('assets')
	list = list.slice(index + 1, list.length)
	return `${list[0]}:${list.slice(2).join('/')}`
}

export async function exportPredicate(models, variantModels, ajSettings) {
	console.groupCollapsed('Export Predicate Model')
	// const projectName = safeFunctionName(aj_settings.projectName)
	const predicateJSON = {
		parent: 'item/generated',
		textures: {
			layer0: `item/${ajSettings.rigItem.replace('minecraft:', '')}`,
		},
		overrides: [],
	}

	const modelPath = getMCPath(ajSettings.rigModelsExportFolder)
	console.log(modelPath)
	for (const [modelName, model] of Object.entries(models)) {
		predicateJSON.overrides.push({
			predicate: { custom_model_data: model.aj.customModelData },
			model: modelPath + '/' + modelName,
		})
	}

	for (const [variantName, variant] of Object.entries(variantModels))
		for (const [modelName, model] of Object.entries(variant)) {
			predicateJSON.overrides.push({
				predicate: { custom_model_data: model.aj.customModelData },
				model: [modelPath, variantName, `${modelName}`].join('/'),
			})
		}

	Blockbench.writeFile(ajSettings.predicateFilePath, {
		content: autoStringify(predicateJSON),
	})
	console.groupEnd('Export Predicate Model')
}

export async function exportTransparentTexture() {
	console.log(transparent)
	Blockbench.writeFile(settings.animatedJava.transparentTexturePath, {
		content: Buffer.from(
			String(transparent).replace('data:image/png;base64,', ''),
			'base64'
		),
	})
}

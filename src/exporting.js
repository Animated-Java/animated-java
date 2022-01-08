import fs from 'fs'
import path, { resolve } from 'path'
import { settings } from './settings'
import { mkdir } from './util/ezfs'
import { CustomError } from './util/customError'
import { tl } from './util/intl'
import { getModelPath } from './util/minecraft/resourcepack'
// import { safeFunctionName } from './util'
import transparent from './assets/transparent.png'

// Exports the model.json rig files
async function exportRigModels(models, variantModels) {
	console.groupCollapsed('Export Rig Models')
	const metaPath = path.join(
		settings.animatedJava.rigModelsExportFolder,
		'.aj_meta'
	)
	let _continue = true

	if (!fs.existsSync(metaPath)) {
		await new Promise((resolve, reject) => {
			let d = new Dialog({
				title: tl('animatedJava.popup.warning.rigFolderUnused.title'),
				lines: tl('animatedJava.popup.warning.rigFolderUnused.body')
					.split('\n')
					.map((line) => `<p>${line}</p>`),
				onConfirm() {
					d.hide()
					Blockbench.writeFile(metaPath, {
						content: Project.UUID,
					})
					resolve()
				},
				onCancel() {
					d.hide()
					reject(
						new CustomError(
							'Rig Folder Unused -> User Cancelled Export Process',
							{ intentional: true, silent: true }
						)
					)
				},
			}).show()
		})
	} else if (fs.readFileSync(metaPath, 'utf-8') !== Project.UUID) {
		await new Promise((resolve, reject) => {
			let d = new Dialog({
				title: tl(
					'animatedJava.popup.error.rigFolderAlreadyUsedByOther.title'
				),
				lines: tl(
					'animatedJava.popup.error.rigFolderAlreadyUsedByOther.body'
				)
					.split('\n')
					.map((line) => `<p>${line}</p>`),
				onConfirm() {
					d.hide()
					Blockbench.writeFile(metaPath, {
						content: Project.UUID,
					})
					resolve()
				},
				onCancel() {
					d.hide()
					reject(
						new CustomError(
							'Rig Folder Already Occupied -> User Cancelled Export Process',
							{ intentional: true, silent: true }
						)
					)
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
		// Don't export empty variants
		if (Object.entries(variant).length < 1) continue

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

async function exportPredicate(models, variantModels, ajSettings) {
	console.groupCollapsed('Export Predicate Model')
	// const projectName = safeFunctionName(aj_settings.projectName)
	const predicateJSON = {
		parent: 'item/generated',
		textures: {
			layer0: `item/${ajSettings.rigItem.replace('minecraft:', '')}`,
		},
		overrides: [],
	}

	for (const [modelName, model] of Object.entries(models)) {
		predicateJSON.overrides.push({
			predicate: { custom_model_data: model.aj.customModelData },
			model: getModelPath(path.join(ajSettings.rigModelsExportFolder, modelName)),
		})
	}

	for (const [variantName, variant] of Object.entries(variantModels))
		for (const [modelName, model] of Object.entries(variant)) {
			predicateJSON.overrides.push({
				predicate: { custom_model_data: model.aj.customModelData },
				model: getModelPath(path.join(ajSettings.rigModelsExportFolder, variantName, modelName), modelName),
			})
		}

	Blockbench.writeFile(ajSettings.predicateFilePath, {
		content: autoStringify(predicateJSON),
	})
	console.groupEnd('Export Predicate Model')
}

async function exportTransparentTexture() {
	console.log(transparent)
	Blockbench.writeFile(settings.animatedJava.transparentTexturePath, {
		content: Buffer.from(
			String(transparent).replace('data:image/png;base64,', ''),
			'base64'
		),
	})
}

export { exportRigModels, exportPredicate, exportTransparentTexture }

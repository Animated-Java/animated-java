import fs from 'fs'
import path, { resolve } from 'path'
import { settings } from './settings'
import { CustomError } from './util/CustomError'
import { translate } from './util/intl'
import { safe_function_name } from './util/replace'

function getTexturePath(texture) {
	const parts = texture.path.split(path.sep)
	const assetsIndex = parts.indexOf('assets')
	if (assetsIndex) {
		const relative = parts.slice(assetsIndex + 1) // Remove 'assets' and everything before it from the path
		const namespace = relative.shift() // Remove the namespace from the path and store it
		relative.push(relative.pop().replace('.png', '')) // Remove file type (.png)
		const textureIndex = relative.indexOf('textures') // Locate 'texture' in the path
		if (textureIndex > -1) {
			relative.splice(textureIndex, 1) // Remove 'texture' from the path
			return `${namespace}:${relative.join('/')}` // Generate texture path
		}
	}
	throw new CustomError({
		message: `Unable to generate texture path for ${texture.name}`,
	})
}

// Exports the model.json rig files
export async function exportRigModels(models, textures) {
	console.groupCollapsed('Export Rig Models')
	const meta_path = path.join(
		settings.animatedJava.rigModelsExportFolder,
		'.aj_meta'
	)

	if (!fs.existsSync(meta_path)) {
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
					Blockbench.writeFile(meta_path, {
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
	} else if (fs.readFileSync(meta_path, 'utf-8') !== Project.UUID) {
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
					Blockbench.writeFile(meta_path, {
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

	console.log('Exported Models:', models)
	console.log('Textures Used:', textures)
	// For every model
	for (const [name, model] of Object.entries(models)) {
		// Get the model's file path
		const model_file_path = path.join(
			settings.animatedJava.rigModelsExportFolder,
			name + '.json'
		)
		console.log('Exporting Model', model_file_path, model.elements)

		// Figure out what textures this model is using, and add them to the model_textures set
		const model_textures = new Set()
		for (const element of model.elements) {
			delete element.uuid // Delete unused element UUID
			for (const [name, face] of Object.entries(element.faces)) {
				model_textures.add(face.texture)
			}
		}
		console.log('Model Textures:', model_textures)

		// Create the texture JSON for the exported model based on the model_textures object
		const textures_JSON = {}
		for (const texture of textures) {
			const id = `${texture.id}`
			if (model_textures.has('#' + id)) {
				textures_JSON[id] = getTexturePath(texture)
			}
		}
		// Export the model
		const modelJSON = {
			__credit: 'Animated Java',
			textures: textures_JSON,
			...model,
		}
		Blockbench.writeFile(model_file_path, {
			content: autoStringify(modelJSON),
		})
	}
	console.groupEnd('Export Rig Models')
}

function getMCPath(raw) {
	let list = raw.split(path.sep)
	console.log(list)
	const index = list.indexOf('assets')
	list = list.slice(index + 1, list.length)
	return `${list[0]}:${list.slice(2).join('/')}`
}

export async function exportPredicate(bones, aj_settings) {
	console.groupCollapsed('Export Predicate Model')
	const project_name = safe_function_name(aj_settings.projectName)
	const predicate_JSON = {
		parent: 'item/generated',
		textures: {
			layer0: `item/${aj_settings.rigItem.replace('minecraft:', '')}`,
		},
		overrides: [],
	}

	const model_path = getMCPath(aj_settings.rigModelsExportFolder)
	console.log(model_path)
	for (const [name, bone] of Object.entries(bones)) {
		predicate_JSON.overrides.push({
			predicate: { custom_model_data: bone.customModelData },
			model: model_path + '/' + name,
		})
	}

	Blockbench.writeFile(aj_settings.predicateFilePath, {
		content: autoStringify(predicate_JSON),
	})
	console.groupEnd('Export Predicate Model')
}

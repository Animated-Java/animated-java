// import translate
import path from 'path'
import { store, translate, cloneObject, size, roundToN } from './util'
import { settings } from './settings'
import './overrides/overrides'
import { CustomError } from './util/CustomError'

function getMCPath(raw) {
	let list = raw.split(path.sep)
	console.log(list)
	const index = list.indexOf('assets')
	list = list.slice(index + 1, list.length)
	return `${list[0]}:${list.slice(2).join('/')}`
}

let globalPredicateId = 0
let globalPredicateCount = 0
// let rootPredicatePath

function getPredicateId() {
	globalPredicateId += 1
	globalPredicateCount += 1
	console.log(`new PID: ${globalPredicateId}`)
	return globalPredicateId
}

function resetPredicateData() {
	globalPredicateId = 0
	globalPredicateCount = 0
	console.log('Reset predicate IDs')
	// if (settings.animatedJava.rig_models_export_folder !== '') {
	// 	root_predicate_path = settings.animatedJava.rig_models_export_folder
	// } else {
	// 	throw new CustomError({
	// 		title: translate('error.missing_predicate_file_path.title'),
	// 		lines: [
	// 			`<p>${translate(
	// 				'error.missing_predicate_file_path.body1'
	// 			)}</p>`,
	// 			`<p>${translate(
	// 				'error.missing_predicate_file_path.body2'
	// 			)}</p>`,
	// 		],
	// 	})
	// }
}

function getTextureByUUID(uuid) {
	return Texture.all.find((t) => t.uuid === uuid)
}

function hasTexture(model, texture) {
	return model.elements.find((e) =>
		Object.values(e.faces).find((f) => f.texture === `#${texture.id}`)
	)
}

function hasSceneAsParent(self) {
	if (self.parent) {
		if (self.parent.name != 'SCENE') {
			return hasSceneAsParent(self.parent)
		} else {
			return true
		}
	} else {
		return false
	}
}

function getModelMCPath(modelPath) {
	const parts = modelPath.split(path.sep)
	const assetsIndex = parts.indexOf('assets')
	if (assetsIndex) {
		const relative = parts.slice(assetsIndex + 1) // Remove 'assets' and everything before it from the path
		const namespace = relative.shift() // Remove the namespace from the path and store it
		relative.push(relative.pop().replace('.png', '')) // Remove file type (.png)
		const modelIndex = relative.indexOf('models') // Locate 'model' in the path
		if (modelIndex > -1) {
			relative.splice(modelIndex, 1) // Remove 'model' from the path
			return `${namespace}:${relative.join('/')}` // Generate model path
		}
	}
	throw new CustomError({
		message: `Unable to generate model path for ${modelPath}`,
	})
}

export function computeElements() {
	console.groupCollapsed('Compute Elements')
	var clear_elements = []
	var textures_used = []
	var element_index_lut = []
	var overflow_elements = []
	var invalid_rot_elements = []

	function computeCube(s) {
		if (s.export == false) return
		if (s.parent === 'root') {
			throw new CustomError({
				title: translate('error.top_level_cubes.title'),
				lines: [
					`<p>${translate('error.top_level_cubes.body1')}</p>`,
					`<p>${translate('error.top_level_cubes.body2')}</p>`,
				],
			})
		}
		var element = { uuid: s.uuid }
		element_index_lut[Cube.all.indexOf(s)] = clear_elements.length
		element.from = s.from.map((v, i) => v - s.parent.origin[i])
		element.to = s.to.map((v, i) => v - s.parent.origin[i])
		// element.from = [
		// 	s.from[0] - s.parent.origin[0],
		// 	s.from[1] - s.parent.origin[1],
		// 	s.from[2] - s.parent.origin[2]
		// ]
		// element.to = [
		// 	s.to[0] - s.parent.origin[0],
		// 	s.to[1] - s.parent.origin[1],
		// 	s.to[2] - s.parent.origin[2]
		// ]

		if (s.inflate) {
			for (var i = 0; i < 3; i++) {
				element.from[i] -= s.inflate
				element.to[i] += s.inflate
			}
		}
		if (s.shade === false) {
			element.shade = false
		}
		if (!s.rotation.allEqual(0) || !s.origin.allEqual(8)) {
			var axis = s.rotationAxis() || 'y'
			element.rotation = new oneLiner({
				angle: s.rotation[getAxisNumber(axis)],
				axis,
				origin: s.origin,
			})
		}
		if (s.rescale) {
			if (element.rotation) {
				element.rotation.rescale = true
			} else {
				element.rotation = new oneLiner({
					angle: 0,
					axis: s.rotation_axis || 'y',
					origin: s.origin,
					rescale: true,
				})
			}
		}
		if (s.rotation.positiveItems() >= 2) {
			element.rotated = s.rotation
		}

		var element_has_texture
		var e_faces = {}
		for (var face in s.faces) {
			if (s.faces.hasOwnProperty(face)) {
				if (s.faces[face].texture !== null) {
					var tag = new oneLiner()
					if (s.faces[face].enabled !== false) {
						tag.uv = s.faces[face].uv.slice()
						tag.uv.forEach((n, i) => {
							tag.uv[i] = (n * 16) / UVEditor.getResolution(i % 2)
						})
					}
					if (s.faces[face].rotation) {
						tag.rotation = s.faces[face].rotation
					}
					if (s.faces[face].texture) {
						var tex = s.faces[face].getTexture()
						if (tex) {
							tag.texture = '#' + tex.id
							textures_used.safePush(tex)
						}
						element_has_texture = true
					}
					if (!tag.texture) {
						tag.texture = '#missing'
					}
					if (s.faces[face].cullface) {
						tag.cullface = s.faces[face].cullface
					}
					if (s.faces[face].tint >= 0) {
						tag.tintindex = s.faces[face].tint
					}
					e_faces[face] = tag
				}
			}
		}
		//Gather Textures
		if (!element_has_texture) {
			element.color = s.color
		}
		element.faces = e_faces
		// element.to = element.to.map(_ => _ + 8);
		// element.from = element.from.map(_ => _ + 8);
		if (element.rotation) {
			element.rotation.origin = element.rotation.origin.map(
				(_, i) => _ - s.parent.origin[i]
			)
			// element.rotation.origin = element.rotation.origin.map(_ => _ / 2.5 + 8);
		}
		function inVd(n) {
			return n < -16 || n > 32
		}
		if (!hasSceneAsParent(s)) {
			if (
				element.rotation &&
				![-45, -22.5, 0, 22.5, 45].includes(element.rotation.angle)
			) {
				invalid_rot_elements.push(s)
			} else if (Object.keys(element.faces).length) {
				clear_elements.push(element)
			}
		}
	}

	function iterate(arr) {
		var i = 0
		if (!arr || !arr.length) {
			return
		}
		for (i = 0; i < arr.length; i++) {
			if (arr[i].type === 'cube') {
				computeCube(arr[i])
			} else if (arr[i].type === 'group') {
				iterate(arr[i].children)
			}
		}
	}
	iterate(Outliner.root)

	const ret = {
		invalid_rot_elements,
		clear_elements,
		textures_used,
		element_index_lut,
	}

	console.log('Elements', ret)
	console.groupEnd('Compute Elements')
	return ret
}

//FIXME This code block should be moved to model_computation.js and it's variables should be passed to AJ by the exporter
//START
const displayScale = 1.6
const displayScaleModifier = 4
const elementScaleModifier = displayScaleModifier / displayScale

async function scaleModels(models) {
	for (const [name, model] of Object.entries(models)) {
		model.display = computeDisplay()
		for (const element of model.elements) {
			element.to = [
				element.to[0] / elementScaleModifier + 8, // Center the x pos in the model
				element.to[1] / elementScaleModifier + 5, // Center the y pos in the model
				element.to[2] / elementScaleModifier + 8, // Center the z pos in the model
			]

			element.from = [
				element.from[0] / elementScaleModifier + 8,
				element.from[1] / elementScaleModifier + 5,
				element.from[2] / elementScaleModifier + 8,
			]

			element.rotation.origin = [
				element.rotation.origin[0] / elementScaleModifier + 8,
				element.rotation.origin[1] / elementScaleModifier + 5,
				element.rotation.origin[2] / elementScaleModifier + 8,
			]
		}
	}
	return models
}
//END

function computeDisplay() {
	return {
		head: {
			translation: [0, 5.6, 0],
			scale: [0, 0, 0].map((_) => displayScaleModifier),
			rotation: [0, 0, 0],
		},
	}
}

function getTexturesOnGroup(group) {
	const textures = {}
	group.children
		.filter((c) => c instanceof Cube)
		.forEach((cube) => {
			for (const [faceName, face] of Object.entries(cube.faces)) {
				const texture = getTextureByUUID(face.texture)
				if (texture) {
					if (!textures[`#${texture.id}`]) {
						textures[`#${texture.id}`] = getTexturePath(
							texture.path
						)
					}
				} else {
					console.log(`Unable to find texture ${face.texture}`)
				}
			}
		})
	return textures
}

export async function computeModels(cubeData) {
	console.groupCollapsed('Compute Models')
	resetPredicateData()

	const models = {}

	function recurse(group) {
		console.log(group)
		const cubeChildren = group.children
			.filter((c) => c instanceof Cube)
			.map((current) =>
				cubeData.clear_elements.find(
					(other) => current.uuid === other.uuid
				)
			)

		if (group instanceof Group && group.name !== 'SCENE' && group.export) {
			if (cubeChildren.length) {
				const cleanedCubes = cloneObject(cubeChildren)
				cleanedCubes.forEach((cube) => (cube.uuid = undefined))

				models[group.name] = {
					aj: { customModelData: getPredicateId() },
					elements: cleanedCubes,
					textures: getTexturesOnGroup(group),
				}
			}

			group.children
				.filter((item) => item instanceof Group)
				.forEach((group) => recurse(group))
		}
	}

	for (const item of Outliner.root) {
		recurse(item)
	}

	console.log('Unscaled Models', models)

	const scaledModels = await scaleModels(models)

	console.log('Scaled Models', scaledModels)
	console.groupEnd('Compute Models')
	return scaledModels
}

export async function computeVariantModels(models, variantOverrides) {
	console.group('Compute Variant Models')
	const variants = store.get('states')
	const variantModels = {}

	for (const [variantName, variant] of Object.entries(variants)) {
		variantModels[variantName] = {}
		const thisVariantOverrides = variantOverrides[variantName]

		for (const [modelName, model] of Object.entries(models)) {
			const thisModelOverrides = thisVariantOverrides[modelName]

			if (thisModelOverrides && size(thisModelOverrides.textures)) {
				const newVariantModel = {
					aj: {
						customModelData: getPredicateId(),
					},
					parent: getModelMCPath(
						path.join(
							settings.animatedJava.rigModelsExportFolder,
							`${modelName}.json`
						)
					),
					textures: thisModelOverrides.textures,
				}
				variantModels[variantName][modelName] = newVariantModel
			}
		}
	}

	console.groupEnd('Compute Variant Models')
	return variantModels
}

export function computeBones(models, animations) {
	console.groupCollapsed('Compute Bones')

	const bones = {}

	for (const value of Project.elements.map((_) => _.mesh)) {
		// const value = Project.groups[name];
		if (value.parent) {
			const parentMesh = value.parent.getMesh()
			if (
				!bones[parentMesh.name] && // Unless this bone already exists in the bones list
				models[parentMesh.name] && // If this bone exists in models.
				models[parentMesh.name].elements.length && // If this bone has elements
				typeof models[parentMesh.name].id !== 'number'
			) {
				console.log('Parent Bone:', parentMesh.name, value.parent)
				value.parent.customModelData =
					models[parentMesh.name].aj.customModelData
				value.parent.scales = {
					'1,1,1': models[parentMesh.name].aj.customModelData,
				}
				value.parent.can_manipulate_arms =
					parentMesh.can_manipulate_arms
				value.parent.nbt = parentMesh.nbt
				bones[parentMesh.name] = value.parent
			}
		}
	}

	function roundScale(scale) {
		return {
			x: roundToN(scale.x, 1000),
			y: roundToN(scale.y, 1000),
			z: roundToN(scale.z, 1000),
		}
	}

	for (const [animUuid, anim] of Object.entries(animations)) {
		for (const frame of anim) {
			for (const [boneName, bone] of Object.entries(frame.bones)) {
				if (bones[boneName]) {
					// Create an object for each bone if it doesn't already exist
					// if (!bones[boneName].scales) {
					// 	console.log('new scale obj')
					// 	bones[boneName].scales = {}
					// }
					// Save this scale to the bone's scale object
					const rounded = roundScale(bone.scale, 1000)
					const vecStr = `${rounded.x},${rounded.y},${rounded.z}`
					if (bone.scale && !bones[boneName].scales[vecStr]) {
						console.log('New Scale:', vecStr)
						bones[boneName].scales[vecStr] = getPredicateId(bone)
					}
				}
			}
		}
	}

	console.log('Bones', bones)
	console.groupEnd('Compute Bones')

	return bones
}

function getTexturePath(raw) {
	let list = raw.split(path.sep)
	console.log(list)
	const index = list.indexOf('assets')
	list = list.slice(index + 1, list.length)
	return `${list[0]}:${list.slice(2).join('/')}`
}

export function computeVariantTextureOverrides(models) {
	console.groupCollapsed('Compute Variant Model Overrides')

	const states = store.get('states')
	const state_models = {}

	for (const [state_name, state] of Object.entries(states).sort()) {
		const this_state = {}
		// console.log('State:', state)
		//* If this state replaces any textures
		if (Object.keys(state).length > 0) {
			// For every model in models
			for (const [model_name, model] of Object.entries(models).sort()) {
				// console.log('Model:', model)
				//* If this model has any of the textures this state replaces
				for (const uuid in state) {
					const texture = getTextureByUUID(uuid)
					const replace_texture = getTextureByUUID(state[uuid])
					if (hasTexture(model, texture)) {
						//* Create texture override based on state
						if (replace_texture) {
							if (!this_state[model_name])
								this_state[model_name] = { textures: {} }
							console.log(replace_texture)
							this_state[model_name].textures[`#${texture.id}`] =
								getTexturePath(replace_texture.path)
						}
					}
				}
			}
		}
		state_models[state_name] = this_state
	}

	console.log('Variant Overrides', state_models)
	console.groupEnd('Compute Variant Model Overrides')

	return state_models
}

// import tl
import path from 'path'
import { store } from './util/store'
import { tl } from './util/intl'
import { cloneObject } from './util/misc'
import { size } from './util/misc'
import { roundToN } from './util/misc'
import * as resourcepack from './util/minecraft/resourcepack'
import { settings } from './settings'
import './overrides/overrides'
import { CustomError } from './util/customError'
import { format, safeFunctionName } from './util/replace'
import { isSceneBased } from './util/hasSceneAsParent'

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
}

function getTextureByUUID(uuid) {
	return Texture.all.find((t) => t.uuid === uuid)
}

function hasTexture(model, texture) {
	return model.elements.find((e) =>
		Object.values(e.faces).find((f) => f.texture === `#${texture.id}`)
	)
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
		if (s.parent === 'root') {
			throw new CustomError('Top Level Cubes Found in model', {
				intentional: true,
				dialog: {
					id: 'animatedJava.dialogs.errors.topLevelCubes',
					title: tl(
						'animatedJava.dialogs.errors.topLevelCubes.title'
					),
					lines: [
						tl('animatedJava.dialogs.errors.topLevelCubes.body'),
					],
					width: 128,
					singleButton: true,
				},
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
					axis: s.rotationAxis() || 'y',
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
		if (!isSceneBased(s)) {
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

	if (invalid_rot_elements.length) {
		throw new CustomError('Invalid Element Rotations', {
			dialog: {
				title: tl(
					'animatedJava.dialogs.errors.invalidCubeRotations.title'
				),
				lines: [
					tl('animatedJava.dialogs.errors.invalidCubeRotations.body'),
				],
				width: 512,
			},
		})
	}
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

function getTexturesOnGroup(group) {
	const textures = {}
	group.children
		.filter((c) => c instanceof Cube)
		.forEach((cube) => {
			for (const [faceName, face] of Object.entries(cube.faces)) {
				const texture = getTextureByUUID(face.texture)
				if (texture) {
					if (!textures[`${texture.id}`]) {
						textures[`${texture.id}`] =
							resourcepack.getTexturePath(texture)
					}
				} else {
					console.log(`Unable to find texture ${face.texture}`)
				}
			}
		})
	return textures
}

async function computeModels(cubeData) {
	console.groupCollapsed('Compute Models')
	resetPredicateData()

	const models = {}

	function recurse(group) {
		console.log(group)
		const cubeChildren = group.children
			.filter((c) => c instanceof Cube && c.export)
			.map((current) =>
				cubeData.clear_elements.find(
					(other) => current.uuid === other.uuid
				)
			)

		if (
			group instanceof Group &&
			group.name !== 'SCENE' &&
			group.export &&
			!isSceneBased(group)
		) {
			console.log('group.children:', group.children)
			console.log('cubeChildren:', cubeChildren)
			if (cubeChildren.length) {
				const elements = []

				cubeChildren.forEach((cube) => {
					if (!cube) {
						throw new CustomError(
							`Unexpected undefined in ${group.name}.children`
						)
					}
					elements.push({
						faces: cube.faces,
						to: cube.to,
						from: cube.from,
						rotation: cube.rotation,
					})
				})
				const modelName = safeFunctionName(group.name)
				models[modelName] = {
					aj: { customModelData: getPredicateId() },
					textures: getTexturesOnGroup(group),
					elements,
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

export async function computeVariantModels(
	models,
	scaleModels,
	variantOverrides
) {
	console.groupCollapsed('Compute Variant Models')
	const variants = store.get('states')
	const variantModels = {}
	const variantTouchedModels = {}

	for (const [variantName, variant] of Object.entries(variants)) {
		variantModels[variantName] = {}
		const thisVariantOverrides = variantOverrides[variantName]

		for (const [modelName, model] of Object.entries(models)) {
			const thisModelOverrides = thisVariantOverrides[modelName]

			if (thisModelOverrides && size(thisModelOverrides.textures)) {
				variantTouchedModels[modelName] = model
				const newVariantModel = {
					aj: {
						customModelData: getPredicateId(),
					},
					parent: getModelMCPath(
						path.join(
							settings.animatedJava.rigModelsExportFolder,
							modelName
						)
					),
					textures: thisModelOverrides.textures,
				}
				variantModels[variantName][modelName] = newVariantModel

				if (!scaleModels[modelName]) continue
				for (const [vecStr, model] of Object.entries(
					scaleModels[modelName]
				)) {
					const clone = cloneObject(model)
					clone.parent = getModelMCPath(
						path.join(
							settings.animatedJava.rigModelsExportFolder,
							variantName,
							modelName
						)
					)
					variantModels[variantName][`${modelName}_${vecStr}`] = clone
				}
			}
		}
	}

	console.groupEnd('Compute Variant Models')
	return { variantModels, variantTouchedModels }
}

export function computeBones(models, animations) {
	console.groupCollapsed('Compute Bones')

	const bones = {}

	for (const value of Project.elements.map((_) => _.mesh)) {
		// const value = Project.groups[name];
		if (value.parent) {
			const parentGroup = value.parent.getGroup()
			if (!parentGroup.export) continue
			const parentName = safeFunctionName(parentGroup.name)
			if (
				!isSceneBased(parentGroup) &&
				!bones[parentName] && // Unless this bone already exists in the bones list
				models[parentName] && // If this bone exists in models.
				models[parentName].elements.length && // If this bone has elements
				typeof models[parentName].id !== 'number'
			) {
				console.log(
					'Parent Bone:',
					parentName,
					'| group:',
					parentGroup,
					'| mesh:',
					value.parent
				)
				value.parent.customModelData =
					models[parentName].aj.customModelData
				value.parent.scales = {
					'1-1-1': models[parentName].aj.customModelData,
				}
				value.parent.armAnimationEnabled =
					parentGroup.armAnimationEnabled
				value.parent.nbt = parentGroup.nbt
				bones[parentName] = value.parent
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

	for (const [_, animation] of Object.entries(animations)) {
		for (const frame of animation.frames) {
			for (const [boneName, bone] of Object.entries(frame.bones)) {
				if (!bones[boneName]) continue
				const scale = roundScale(bone.scale)
				const vecStr = `${scale.x}-${scale.y}-${scale.z}`
				if (bone.scale && !bones[boneName].scales[vecStr]) {
					console.log('New scale', vecStr)
					bones[boneName].scales[vecStr] = getPredicateId()
				}
			}
		}
	}

	console.log('Bones', bones)
	console.groupEnd('Compute Bones')

	return bones
}

const displayScale = 1.6
let displayScaleModifier = 1
let elementScaleModifier = displayScaleModifier / displayScale
let yTranslation = 5.6

function computeScaleModifiers() {
	displayScaleModifier =
		settings.animatedJava.modelScalingMode === '3x3x3' ? 1 : 4
	elementScaleModifier = displayScaleModifier / displayScale
	// I love magic numbers 😢
	yTranslation =
		settings.animatedJava.modelScalingMode === '3x3x3' ? -3.2 : 5.6
}

async function scaleModels(models) {
	computeScaleModifiers()
	for (const [modelName, model] of Object.entries(models)) {
		model.display = {
			head: {
				translation: [0, yTranslation, 0],
				scale: [1, 1, 1].map((v) => displayScaleModifier),
				rotation: [0, 0, 0],
			},
		}

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

			if (element.rotation) {
				element.rotation.origin = [
					element.rotation.origin[0] / elementScaleModifier + 8,
					element.rotation.origin[1] / elementScaleModifier + 5,
					element.rotation.origin[2] / elementScaleModifier + 8,
				]
			}
		}
	}
	return models
}

function vecStrToArray(vecStr) {
	return vecStr.split('-').map((v) => Number(v))
}

function throwIfScaleOutOfBounds(scale, boneName) {
	if (scale[0] > 4 || scale[1] > 4 || scale[2] > 4) {
		throw new CustomError('Scaling out of bounds', {
			dialog: {
				title: tl('animatedJava.dialogs.errors.scaleOutOfBounds.title'),
				lines: [
					tl('animatedJava.dialogs.errors.scaleOutOfBounds.body', {
						boneName,
						displayString: `${boneName}: [${scale.join(
							', '
						)}] > maximum: [3.125, 3.125, 3.125]`,
					}),
				],
				width: 512,
			},
		})
	}
	if (scale[0] < -4 || scale[1] < -4 || scale[2] < -4) {
		throw new CustomError('Scaling out of bounds', {
			dialog: {
				title: tl('animatedJava.dialogs.errors.scaleOutOfBounds.title'),
				lines: [
					tl('animatedJava.dialogs.errors.scaleOutOfBounds.body', {
						boneName,
						displayString: `${boneName}: [${scale.join(
							', '
						)}] < minimum: [-3.125, -3.125, -3.125]`,
					}),
				],
				width: 512,
			},
		})
	}
}

export function computeScaleModels(bones) {
	computeScaleModifiers()
	const scaleModels = {}

	for (const [boneName, bone] of Object.entries(bones)) {
		// Skip bones without scaling
		if (Object.keys(bone.scales).length <= 1) continue
		scaleModels[boneName] = {}

		for (const [vecStr, customModelData] of Object.entries(bone.scales)) {
			const scale = vecStrToArray(vecStr)
			const mappedScale = scale.map((v) => v * displayScaleModifier)
			throwIfScaleOutOfBounds(mappedScale, boneName)

			const model = {
				parent: getModelMCPath(
					path.join(
						settings.animatedJava.rigModelsExportFolder,
						boneName
					)
				),
				display: {
					head: {
						translation: [
							0,
							yTranslation + -yTranslation * (scale[1] - 1),
							0,
						],
						scale: scale.map((v) => v * displayScaleModifier || 1),
						rotation: [0, 0, 0],
					},
				},
				aj: { customModelData },
			}
			scaleModels[boneName][vecStr] = model
		}
	}

	return scaleModels
}

export function computeVariantTextureOverrides(models) {
	console.groupCollapsed('Compute Variant Model Overrides')

	const variants = store.get('states')
	const variantModels = {}

	let transparentTexturePath
	if (settings.animatedJava.transparentTexturePath) {
		transparentTexturePath = resourcepack.getTexturePath({
			name: 'Transparent Texture',
			path: settings.animatedJava.transparentTexturePath,
			saved: true,
		})
	}

	for (const [variantName, variant] of Object.entries(variants).sort()) {
		const thisVariant = {}
		// console.log('State:', state)
		//* If this state replaces any textures
		if (Object.keys(variant).length > 0) {
			// For every model in models
			for (const [modelName, model] of Object.entries(models).sort()) {
				// console.log('Model:', model)
				//* If this model has any of the textures this state replaces
				for (const uuid in variant) {
					const texture = getTextureByUUID(uuid)
					const replaceTexture = getTextureByUUID(variant[uuid])
					if (hasTexture(model, texture)) {
						//* Create texture override based on state
						if (replaceTexture) {
							if (!thisVariant[modelName]) {
								thisVariant[modelName] = { textures: {} }
							}
							console.log(texture, '->', replaceTexture)
							thisVariant[modelName].textures[`${texture.id}`] =
								resourcepack.getTexturePath(replaceTexture)
						} else if (variant[uuid] === 'transparent') {
							if (transparentTexturePath) {
								if (!thisVariant[modelName]) {
									thisVariant[modelName] = { textures: {} }
								}
								console.log(texture, '-> transparent')
								thisVariant[modelName].textures[
									`${texture.id}`
								] = transparentTexturePath
							} else {
								throw new CustomError(
									'Transparent Texture Path Not Found',
									{
										intentional: true,
										dialog: {
											id: 'animatedJava.dialogs.errors.transparentTexturePathNotFound',
											title: tl(
												'animatedJava.dialogs.errors.transparentTexturePathNotFound.title'
											),
											lines: [
												tl(
													'animatedJava.dialogs.errors.transparentTexturePathNotFound.body'
												),
											],
											width: 512,
											singleButton: true,
										},
									}
								)
							}
						}
					}
				}
			}
		}
		variantModels[variantName] = thisVariant
	}

	console.log('Variant Overrides', variantModels)
	console.groupEnd('Compute Variant Model Overrides')

	return variantModels
}
export { computeModels }

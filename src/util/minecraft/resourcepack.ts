//@ts-ignore
import * as path from 'path'
import { CustomError } from '../customError'
import { tl } from '../intl'
import { normalizePath } from '../misc'

function capatalizeFirst(str: string) {
	return str[0].toUpperCase() + str[1].toLowerCase()
}

function throwFailedToGeneratePath(name: string, item: any) {
	const capName = capatalizeFirst(name)
	throw new CustomError(`Unable to generate ${name} path`, {
		dialog: {
			id: `animatedJava.dialogs.errors.unableToGenerate${capName}Path`,
			title: tl(
				`animatedJava.dialogs.errors.unableToGenerate${capName}Path.title`
			),
			lines: [
				tl(
					`animatedJava.dialogs.errors.unableToGenerate${capName}Path.body`,
					{
						[`${name}Name`]: item.name,
					}
				),
			],
			width: 512,
			singleButton: true,
		},
	})
}

function throwIfUnsavedTexture(texture: any) {
	if (!texture.path || !texture.saved)
		throw new CustomError('Unsaved texture', {
			dialog: {
				id: 'animatedJava.dialogs.errors.unsavedTexture',
				title: tl('animatedJava.dialogs.errors.unsavedTexture.title'),
				lines: [
					tl('animatedJava.dialogs.errors.unsavedTexture.body', {
						textureName: texture.name,
					}),
				],
				width: 512,
				singleButton: true,
			},
		})
}

function throwIfInvalidPath(referencePath: string) {
	if (referencePath.match(/[A-Z]/))
		throw new CustomError('Invalid Resource Path', {
			dialog: {
				id: 'animatedJava.dialogs.errors.invalidResourcePath',
				title: tl(
					'animatedJava.dialogs.errors.invalidResourcePath.title'
				),
				lines: [
					tl('animatedJava.dialogs.errors.invalidResourcePath.body', {
						path: referencePath,
					}),
				],
				width: 512,
				singleButton: true,
			},
		})
}

export function getTexturePath(texture: any) {
	throwIfUnsavedTexture(texture)
	const parts = texture.path.split(path.sep)
	const assetsIndex = parts.indexOf('assets')
	if (assetsIndex) {
		const relative = parts.slice(assetsIndex + 1) // Remove 'assets' and everything before it from the path
		const namespace = relative.shift() // Remove the namespace from the path and store it
		if (namespace && relative.length) {
			relative.push(relative.pop().replace(/.png$/, '')) // Remove file type (.png)
			if (relative) {
				const textureIndex = relative.indexOf('textures') // Locate 'texture' in the path
				if (textureIndex > -1) {
					relative.splice(textureIndex, 1) // Remove 'texture' from the path
					const textureReference = `${namespace}:${normalizePath(
						path.join(...relative)
					)}` // Generate texture path
					console.log('Texture Reference:', textureReference)
					throwIfInvalidPath(textureReference)
					return textureReference
				}
			}
		}
	}
	throwFailedToGeneratePath('texture', texture)
}

export function getModelPath(modelPath: string, modelName: string) {
	console.log(modelPath)
	const parts = modelPath.split(path.sep)
	const assetsIndex = parts.indexOf('assets')
	if (assetsIndex) {
		const relative = parts.slice(assetsIndex + 1) // Remove 'assets' and everything before it from the path
		const namespace = relative.shift() // Remove the namespace from the path and store it
		if (namespace && relative.length) {
			relative.push(relative.pop().replace(/.png$/, '')) // Remove file type (.png)
			if (relative) {
				const modelsIndex = relative.indexOf('models') // Locate 'texture' in the path
				if (modelsIndex > -1) {
					relative.splice(modelsIndex, 1) // Remove 'texture' from the path
					const modelReference = `${namespace}:${normalizePath(
						path.join(...relative)
					)}` // Generate texture path
					console.log('Model Reference:', modelReference)
					throwIfInvalidPath(modelReference)
					return modelReference
				}
			}
		}
	}
	throwFailedToGeneratePath('model', { name: modelName })
}

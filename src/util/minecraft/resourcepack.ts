//@ts-ignore
import * as path from 'path'
import { CustomError } from '../customError'
import { tl } from '../intl'
import { normalizePath } from '../misc'
import { format } from '../replace'

export function getTexturePath(texture: any) {
	if (!texture.path || !texture.saved) {
		console.log('Unsaved texture:', texture)
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
					return textureReference
				}
			}
		}
	}
	console.log('Failed to generate path for:', texture)
	throw new CustomError('Unable to generate texture path', {
		dialog: {
			id: 'animatedJava.dialogs.errors.unableToGenerateTexturePath',
			title: tl(
				'animatedJava.dialogs.errors.unableToGenerateTexturePath.title'
			),
			lines: [
				tl(
					'animatedJava.dialogs.errors.unableToGenerateTexturePath.body',
					{
						textureName: texture.name,
					}
				),
			],
			width: 512,
			singleButton: true,
		},
	})
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
					return modelReference
				}
			}
		}
	}
	throw new CustomError('Unable to generate model path', {
		dialog: {
			id: 'animatedJava.dialogs.errors.unableToGenerateModelPath',
			title: tl(
				'animatedJava.dialogs.errors.unableToGenerateModelPath.title'
			),
			lines: [
				tl(
					'animatedJava.dialogs.errors.unableToGenerateModelPath.body',
					{
						modelName,
					}
				),
			],
			width: 512,
			singleButton: true,
		},
	})
}

//@ts-ignore
import * as path from 'path'
import { CustomError } from '../customError'
import { tl } from '../intl'
import { format } from '../replace'

export function getTexturePath(texture: any) {
	if (!texture.path) {
		throw new CustomError(tl(`animatedJava.popup.error.unsavedTexture.title`), {
			dialog: {
				title: tl(
					'animatedJava.popup.error.unsavedTexture.title'
				),
				lines: format(
					tl('animatedJava.popup.error.unsavedTexture.body'),
					{
						textureName: texture.name,
					}
				)
					.split('\n')
					.map((line: string) => `<p>${line}</p>`),
				width: 512,
			},
		})
	}
	const parts = texture.path.split(path.sep)
	const assetsIndex = parts.indexOf('assets')
	if (assetsIndex) {
		const relative = parts.slice(assetsIndex + 1) // Remove 'assets' and everything before it from the path
		const namespace = relative.shift() // Remove the namespace from the path and store it
		relative.push(relative.pop().replace(/.png$/, '')) // Remove file type (.png)
		const textureIndex = relative.indexOf('textures') // Locate 'texture' in the path
		if (textureIndex > -1) {
			relative.splice(textureIndex, 1) // Remove 'texture' from the path
			return `${namespace}:${relative.join('/')}` // Generate texture path
		}
	}
	throw new CustomError(`Unable to generate texture path for ${texture.name}`)
}

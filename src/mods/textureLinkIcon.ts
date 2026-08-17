import { registerProjectPatch } from 'blockbench-patch-manager'
import { BLUEPRINT_FORMAT_ID } from '../formats/blueprint'
import { isResourcePackPath } from '../util/minecraftUtil'

export function updateTextureIcon(texture: Texture) {
	const saveIcon = document.querySelector(`li[texid="${texture.uuid}"] .texture_save_icon`)
	if (!saveIcon) return

	if (texture.path && isResourcePackPath(texture.path)) {
		saveIcon.innerHTML = 'link'
		saveIcon.setAttribute('title', 'Linked to resource pack')
	} else {
		saveIcon.setAttribute('title', '')
	}
}

registerProjectPatch({
	id: `animated_java:texture-link-icon`,

	condition({ project }) {
		return project.format.id === BLUEPRINT_FORMAT_ID
	},

	apply() {
		requestAnimationFrame(() => {
			for (const texture of Texture.all) {
				console.log('texture', texture)
				updateTextureIcon(texture)
			}
		})

		const onTextureChange = ({ texture }: BlockbenchEventMap['change_texture_path']) =>
			updateTextureIcon(texture)

		Blockbench.on('change_texture_path', onTextureChange)
		Blockbench.on('add_texture', onTextureChange)
		Blockbench.on('select_texture', onTextureChange)

		return { onTextureChange }
	},

	revert({ onTextureChange }) {
		Blockbench.removeListener('change_texture_path', onTextureChange)
		Blockbench.removeListener('add_texture', onTextureChange)
		Blockbench.removeListener('select_texture', onTextureChange)
	},
})

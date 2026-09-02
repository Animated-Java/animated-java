import { registerProjectPatch } from 'blockbench-patch-manager'
import { getFsModule } from '../constants'
import { activeProjectIsBlueprintFormat, BLUEPRINT_FORMAT_ID } from '../formats/blueprint'
import { isResourcePackPath } from '../util/minecraftUtil'

/**
 * Force internal texture names to Minecraft-safe characters and keep them unique.
 *
 * Textures linked from a valid resource pack are referenced by resource location
 * and never written beside the blueprint's own textures, so their names are left
 * alone and are allowed to collide with an internal texture's name.
 */
function sanitizeTextureNames() {
	if (!activeProjectIsBlueprintFormat()) return

	const { existsSync } = getFsModule()
	const isLinked = (texture: Texture) =>
		!!texture.path && isResourcePackPath(texture.path) && existsSync(texture.path)

	const taken = new Set<string>()
	for (const texture of Texture.all) {
		if (isLinked(texture)) continue

		const ext = /\.[a-z0-9]+$/i.exec(texture.name)?.[0].toLowerCase() ?? ''
		let stem = texture.name.slice(0, texture.name.length - ext.length)
		stem = stem.toLowerCase().replace(/[^a-z0-9._-]/g, '_') || 'texture'

		let name = stem + ext
		for (let i = 2; taken.has(name); i++) name = `${stem}_${i}${ext}`
		taken.add(name)

		if (texture.name !== name) texture.name = name
	}
}

registerProjectPatch({
	id: `animated_java:texture-name-sanitizer`,

	condition: ({ project }) => project.format.id === BLUEPRINT_FORMAT_ID,

	apply() {
		requestAnimationFrame(() => sanitizeTextureNames())

		const onAddTexture = () => sanitizeTextureNames()
		const onFinishEdit = ({ aspects }: BlockbenchEventMap['finish_edit']) => {
			if (aspects.textures) sanitizeTextureNames()
		}

		Blockbench.on('add_texture', onAddTexture)
		Blockbench.on('finish_edit', onFinishEdit)

		return { onAddTexture, onFinishEdit }
	},

	revert({ onAddTexture, onFinishEdit }) {
		Blockbench.removeListener('add_texture', onAddTexture)
		Blockbench.removeListener('finish_edit', onFinishEdit)
	},
})

import { registerProjectPatch, registerPropertyOverridePatch } from 'blockbench-patch-manager'
import { activeProjectIsBlueprintFormat, BLUEPRINT_FORMAT_ID } from '../formats/blueprint'
import { isParsingBlueprint } from '../formats/blueprint/codec'
import { getBaseLabel, getGeneratedSource, isGeneratedTexture } from '../palettes/sets'
import { localize } from '../util/lang'
import { isTextureSlot } from '../textureSlots'
import { isResourcePackPath } from '../util/minecraftUtil'

/** A texture that Animated Java does not write to a file of its own on export. */
function isManagedByBlueprint(texture: Texture): boolean {
	return !!texture.internal || (!!texture.path && isResourcePackPath(texture.path))
}

/**
 * Sets an element's text only when it differs, so re-applying icons after Blockbench re-renders a
 * row doesn't cause another round of DOM mutations.
 */
function setText(element: HTMLElement, text: string) {
	if (element.textContent !== text) element.textContent = text
}

export function updateTextureIcon(texture: Texture) {
	const saveIcon = document.querySelector<HTMLElement>(
		`li[texid="${texture.uuid}"] .texture_save_icon`
	)
	if (!saveIcon) return

	const description = saveIcon.closest('li.texture')?.querySelector<HTMLElement>('.texture_res')
	const generated = getGeneratedSource(texture)

	if (isGeneratedTexture(texture)) {
		setText(saveIcon, 'colorize')
		saveIcon.setAttribute('title', localize('panel.textures.palette_generated_icon'))
		saveIcon.classList.remove('clickable')
		if (description) {
			setText(
				description,
				generated
					? localize(
							'panel.textures.palette_generated_description',
							getBaseLabel(generated.set, generated.base),
							generated.permutation.suffix
						)
					: localize('panel.textures.palette_generated_orphaned')
			)
		}
	} else if (isTextureSlot(texture)) {
		setText(saveIcon, 'style')
		saveIcon.setAttribute('title', localize('panel.textures.slot_icon'))
		saveIcon.classList.remove('clickable')
		if (description) {
			setText(
				description,
				localize('panel.textures.slot_description', String(texture.slot_textures.length))
			)
		}
	} else if (texture.path && isResourcePackPath(texture.path)) {
		// Referenced from a resource pack by resource location.
		setText(saveIcon, 'link')
		saveIcon.setAttribute('title', localize('panel.textures.linked_icon'))
		saveIcon.classList.remove('clickable')
	} else if (texture.internal) {
		// Embedded in the Blueprint - there is nothing to save to disk.
		setText(saveIcon, 'box')
		saveIcon.setAttribute('title', localize('panel.textures.internal_icon'))
		saveIcon.classList.remove('clickable')
	} else {
		// A file on disk - restore Blockbench's own save state.
		setText(saveIcon, texture.saved ? 'check_circle' : 'save')
		saveIcon.setAttribute('title', '')
		saveIcon.classList.toggle('clickable', !texture.saved)
	}
}

// The status icon is informational, but its element still carries Blockbench's
// `@click="texture.save()"` handler. Rather than block pointer events (which also
// kills the tooltip), make `save()` a no-op for textures the Blueprint manages.
registerPropertyOverridePatch({
	id: `animated_java:texture/skip-save-for-managed-textures`,
	target: Texture.prototype,
	key: 'save',
	condition: () => activeProjectIsBlueprintFormat(),
	get: original => {
		return function (this: Texture, as?: any) {
			if (!as && isManagedByBlueprint(this)) return this
			return original.call(this, as)
		}
	},
})

// `fromPath` is where a "Save As" (or a relink) turns an internal texture into a
// file-backed one. No event is fired for it, so refresh the icon here, and mark
// the Blueprint dirty since the texture's stored path just changed. Loading a
// Blueprint links its textures the same way, but that isn't an edit.
registerPropertyOverridePatch({
	id: `animated_java:texture/refresh-icon-on-from-path`,
	target: Texture.prototype,
	key: 'fromPath',
	condition: () => activeProjectIsBlueprintFormat(),
	get: original => {
		return function (this: Texture, path: string, externalDataLoader?: any) {
			const wasInternal = !!this.internal
			const result = original.call(this, path, externalDataLoader)
			requestAnimationFrame(() => updateTextureIcon(this))
			if (wasInternal && !this.internal && Project && !isParsingBlueprint()) {
				Project.saved = false
			}
			return result
		}
	},
})

registerProjectPatch({
	id: `animated_java:texture-link-icon`,

	condition({ project }) {
		return project.format.id === BLUEPRINT_FORMAT_ID
	},

	apply() {
		const refreshAll = () => {
			for (const texture of Texture.all) updateTextureIcon(texture)
		}
		requestAnimationFrame(refreshAll)

		// Blockbench re-renders rows when a texture group unfolds or an image changes, which puts
		// its own icon and resolution text back. Re-apply ours on the next frame after any change.
		let queued = false
		const observer = new MutationObserver(() => {
			if (queued) return
			queued = true
			requestAnimationFrame(() => {
				queued = false
				refreshAll()
			})
		})
		const observe = () => {
			const list = document.getElementById('texture_list')
			if (list)
				observer.observe(list, { childList: true, subtree: true, characterData: true })
			else requestAnimationFrame(observe)
		}
		observe()

		const onTextureChange = ({ texture }: BlockbenchEventMap['change_texture_path']) =>
			updateTextureIcon(texture)
		// `change_texture_path` only fires on "Reopen"; catch every other path
		// change (relink, properties dialog, undo/redo) via the edit it commits.
		const onFinishedEdit = (data: BlockbenchEventMap['finished_edit']) => {
			if ('remote' in data || data.aspects.textures) requestAnimationFrame(refreshAll)
		}

		Blockbench.on('change_texture_path', onTextureChange)
		Blockbench.on('add_texture', onTextureChange)
		Blockbench.on('select_texture', onTextureChange)
		Blockbench.on('finished_edit', onFinishedEdit)

		return { onTextureChange, onFinishedEdit, observer }
	},

	revert({ onTextureChange, onFinishedEdit, observer }) {
		observer.disconnect()
		Blockbench.removeListener('change_texture_path', onTextureChange)
		Blockbench.removeListener('add_texture', onTextureChange)
		Blockbench.removeListener('select_texture', onTextureChange)
		Blockbench.removeListener('finished_edit', onFinishedEdit)
	},
})

import { observable } from 'svelte-observable-store'
import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import { getSlotPreviewTexture, previewSlotTexture, updateSlotImage } from '../../textureSlots'
import { localize as translate } from '../../util/lang'
import TextureSlotConfigSvelteComponent from './textureSlotConfig.svelte'

export function openTextureSlotDialog(slot: Texture) {
	const name = observable(slot.name)
	const textures = observable([...slot.slot_textures])
	const preview = observable(getSlotPreviewTexture(slot)?.uuid)

	new SvelteDialog({
		id: `${PACKAGE.name}:textureSlotConfig`,
		title: translate('dialog.texture_slot.title'),
		width: 520,
		component: TextureSlotConfigSvelteComponent,
		props: { slot, name, textures, preview },
		disableKeybinds: true,
		onConfirm() {
			Undo.initEdit({ textures: [slot] })
			slot.name = name.get().trim() || slot.name
			slot.slot_textures = textures.get()
			Undo.finishEdit('Edit texture slot')
			previewSlotTexture(slot, preview.get())
			updateSlotImage(slot)
		},
	}).show()
}

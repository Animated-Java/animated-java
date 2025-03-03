import { CommonDisplayConfig } from '@aj/systems/node-configs'
import { isCurrentFormat } from '../../../blockbench-additions/model-formats/ajblueprint'
import { BlockDisplay } from '../../../blockbench-additions/outliner-elements/blockDisplay'
import { PACKAGE } from '../../../constants'
import { createAction } from '../../../util/moddingTools'
import { Syncable } from '../../../util/stores'
import { SvelteDialog } from '../../../util/svelteDialog'
import { translate } from '../../../util/translation'
import { Variant } from '../../../variants'
import BlockDisplayConfigDialog from './vanillaBlockDisplayConfigDialog.svelte'

export function openBlockDisplayConfigDialog(display: BlockDisplay) {
	// Blockbench's JSON stringifier doesn't handle custom toJSON functions, so I'm storing the config JSON in the bone instead of the actual GenericDisplayConfig object
	const oldConfig = new CommonDisplayConfig().fromJSON(
		(display.config ??= new CommonDisplayConfig().toJSON())
	)

	const customName = new Syncable(oldConfig.customName)
	const customNameVisible = new Syncable(oldConfig.customNameVisible)
	const billboard = new Syncable(oldConfig.billboard as string)
	const overrideBrightness = new Syncable(oldConfig.overrideBrightness)
	const brightnessOverride = new Syncable(oldConfig.brightness)
	const glowing = new Syncable(oldConfig.glowing)
	const overrideGlowColor = new Syncable(oldConfig.overrideGlowColor)
	const glowColor = new Syncable(oldConfig.glowColor)
	const invisible = new Syncable(oldConfig.invisible)
	const nbt = new Syncable(oldConfig.nbt)
	const shadowRadius = new Syncable(oldConfig.shadowRadius)
	const shadowStrength = new Syncable(oldConfig.shadowStrength)
	const useNBT = new Syncable(oldConfig.useNBT)

	new SvelteDialog({
		id: `${PACKAGE.name}:vanillaItemDisplayConfigDialog`,
		title: translate('dialog.block_display_config.title'),
		width: 400,
		component: BlockDisplayConfigDialog,
		props: {
			variant: Variant.selected,
			customName,
			customNameVisible,
			billboard,
			overrideBrightness,
			brightnessOverride,
			glowing,
			overrideGlowColor,
			glowColor,
			invisible,
			nbt,
			shadowRadius,
			shadowStrength,
			useNBT,
		},
		preventKeybinds: true,
		onConfirm() {
			const newConfig = new CommonDisplayConfig()

			newConfig.customName = customName.get()
			newConfig.customNameVisible = customNameVisible.get()
			newConfig.billboard = billboard.get() as any
			newConfig.overrideBrightness = overrideBrightness.get()
			newConfig.brightness = brightnessOverride.get()
			newConfig.glowing = glowing.get()
			newConfig.overrideGlowColor = overrideGlowColor.get()
			newConfig.glowColor = glowColor.get()
			newConfig.invisible = invisible.get()
			newConfig.nbt = nbt.get()
			newConfig.shadowRadius = shadowRadius.get()
			newConfig.shadowStrength = shadowStrength.get()
			newConfig.useNBT = useNBT.get()

			const defaultConfig = CommonDisplayConfig.getDefault()

			newConfig.customName === defaultConfig.customName && (newConfig.customName = undefined)
			newConfig.customNameVisible === defaultConfig.customNameVisible &&
				(newConfig.customNameVisible = undefined)
			newConfig.billboard === defaultConfig.billboard && (newConfig.billboard = undefined)
			newConfig.overrideBrightness === defaultConfig.overrideBrightness &&
				(newConfig.overrideBrightness = undefined)
			newConfig.brightness === defaultConfig.brightnessOverride &&
				(newConfig.brightness = undefined)
			newConfig.glowing === defaultConfig.glowing && (newConfig.glowing = undefined)
			newConfig.overrideGlowColor === defaultConfig.overrideGlowColor &&
				(newConfig.overrideGlowColor = undefined)
			newConfig.glowColor === defaultConfig.glowColor && (newConfig.glowColor = undefined)
			newConfig.invisible === defaultConfig.invisible && (newConfig.invisible = undefined)
			newConfig.nbt === defaultConfig.nbt && (newConfig.nbt = undefined)
			newConfig.shadowRadius === defaultConfig.shadowRadius &&
				(newConfig.shadowRadius = undefined)
			newConfig.shadowStrength === defaultConfig.shadowStrength &&
				(newConfig.shadowStrength = undefined)
			newConfig.useNBT === defaultConfig.useNBT && (newConfig.useNBT = undefined)

			display.config = newConfig.toJSON()
		},
	}).show()
}

export const VANILLA_BLOCK_DISPLAY_CONFIG_ACTION = createAction(
	`${PACKAGE.name}:open_block_display_config`,
	{
		icon: 'settings',
		name: translate('action.open_block_display_config.name'),
		condition: () => isCurrentFormat(),
		click: () => {
			if (BlockDisplay.selected.length === 0) return
			openBlockDisplayConfigDialog(BlockDisplay.selected[0])
		},
	}
)

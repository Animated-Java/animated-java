import { registerAction } from 'src/util/moddingTools'
import TextDisplayConfigDialog from '../../components/textDisplayConfigDialog.svelte'
import { PACKAGE } from '../../constants'
import { activeProjectIsBlueprintFormat } from '../../formats/blueprint/format'
import { TextDisplayConfig } from '../../nodeConfigs'
import { TextDisplay } from '../../outliner/textDisplay'
import { Valuable } from '../../util/stores'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'

export function openBoneConfigDialog(bone: TextDisplay) {
	// Blockbench's JSON stringifier doesn't handle custom toJSON functions, so I'm storing the config JSON in the bone instead of the actual BoneConfig object
	const oldConfig = TextDisplayConfig.fromJSON((bone.config ??= new TextDisplayConfig().toJSON()))

	const billboard = new Valuable(oldConfig.billboard as string)
	const overrideBrightness = new Valuable(oldConfig.overrideBrightness)
	const brightnessOverride = new Valuable(oldConfig.brightnessOverride)
	const glowing = new Valuable(oldConfig.glowing)
	const overrideGlowColor = new Valuable(oldConfig.overrideGlowColor)
	const glowColor = new Valuable(oldConfig.glowColor)
	const invisible = new Valuable(oldConfig.invisible)
	const nbt = new Valuable(oldConfig.nbt)
	const shadowRadius = new Valuable(oldConfig.shadowRadius)
	const shadowStrength = new Valuable(oldConfig.shadowStrength)
	const useNBT = new Valuable(oldConfig.useNBT)

	new SvelteDialog({
		id: `${PACKAGE.name}:textDisplayConfigDialog`,
		title: translate('dialog.text_display_config.title'),
		width: 600,
		content: {
			component: TextDisplayConfigDialog,
			props: {
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
		},
		preventKeybinds: true,
		onConfirm() {
			const newConfig = new TextDisplayConfig()

			newConfig.billboard = billboard.get() as any
			newConfig.overrideBrightness = overrideBrightness.get()
			newConfig.brightnessOverride = brightnessOverride.get()
			newConfig.glowing = glowing.get()
			newConfig.overrideGlowColor = overrideGlowColor.get()
			newConfig.glowColor = glowColor.get()
			newConfig.invisible = invisible.get()
			newConfig.nbt = nbt.get()
			newConfig.shadowRadius = shadowRadius.get()
			newConfig.shadowStrength = shadowStrength.get()
			newConfig.useNBT = useNBT.get()

			const defaultConfig = TextDisplayConfig.getDefault()

			newConfig.billboard === defaultConfig.billboard && (newConfig.billboard = undefined)
			newConfig.overrideBrightness === defaultConfig.overrideBrightness &&
				(newConfig.overrideBrightness = undefined)
			newConfig.brightnessOverride === defaultConfig.brightnessOverride &&
				(newConfig.brightnessOverride = undefined)
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

			bone.config = newConfig.toJSON()

			Project!.saved = false
		},
	}).show()
}

export const TEXT_DISPLAY_CONFIG_ACTION = registerAction(
	{ id: `animated-java:text-display-config` },
	{
		icon: 'settings',
		name: translate('action.open_text_display_config.name'),
		condition: () => activeProjectIsBlueprintFormat(),
		click: () => {
			if (TextDisplay.selected.length === 0) return
			openBoneConfigDialog(TextDisplay.selected[0])
		},
	}
)

TEXT_DISPLAY_CONFIG_ACTION.onCreated(action => {
	TextDisplay.prototype.menu = new Menu([
		...Outliner.control_menu_group,
		action,
		'_',
		'rename',
		'delete',
	])
})

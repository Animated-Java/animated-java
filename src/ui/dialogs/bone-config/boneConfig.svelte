<script lang="ts">
	import { Syncable } from '../../../util/stores'
	import { translate } from '../../../util/translation'

	import { JsonText } from '@aj/systems/minecraft-temp/jsonText'
	import { NbtCompound, NbtTag } from 'deepslate/lib/nbt'

	const IS_PLUGIN_MODE = Project?.animated_java?.environment === 'plugin'

	export let boneConfig: GenericDisplayConfig

	const customName = new Syncable(boneConfig.customName!)
	const customNameVisible = new Syncable(boneConfig.customNameVisible!)
	const billboard = new Syncable(boneConfig.billboard!)
	const overrideBrightness = new Syncable(boneConfig.overrideBrightness!)
	const brightnessOverride = new Syncable(boneConfig.brightnessOverride!)
	const enchanted = new Syncable(boneConfig.enchanted!)
	const glowing = new Syncable(boneConfig.glowing!)
	const overrideGlowColor = new Syncable(boneConfig.overrideGlowColor!)
	const glowColor = new Syncable(boneConfig.glowColor!)
	const inheritSettings = new Syncable(boneConfig.inheritSettings!)
	const invisible = new Syncable(boneConfig.invisible!)
	const nbt = new Syncable(boneConfig.nbt!)
	const shadowRadius = new Syncable(boneConfig.shadowRadius!)
	const shadowStrength = new Syncable(boneConfig.shadowStrength!)
	const useNBT = new Syncable(boneConfig.useNBT!)

	const BILLBOARD_OPTIONS: Record<BillboardMode, string> = {
		fixed: translate('dialog.bone_config.billboard.options.fixed'),
		vertical: translate('dialog.bone_config.billboard.options.vertical'),
		horizontal: translate('dialog.bone_config.billboard.options.horizontal'),
		center: translate('dialog.bone_config.billboard.options.center'),
	}

	const nbtChecker: DialogItemValueChecker<string> = value => {
		let parsedNbt: NbtTag | undefined
		try {
			parsedNbt = NbtTag.fromString(value)
		} catch (e: any) {
			return {
				type: 'error',
				message: translate('dialog.bone_config.nbt.invalid_nbt.error', e.message),
			}
		}
		if (!(parsedNbt instanceof NbtCompound)) {
			return {
				type: 'error',
				message: translate('dialog.bone_config.nbt.invalid_nbt.not_compound'),
			}
		}

		return { type: 'success', message: '' }
	}

	const customNameChecker: DialogItemValueChecker<string> = value => {
		if (value === '') return { type: 'success', message: '' }

		try {
			JsonText.fromString(value)
		} catch (e: any) {
			return {
				type: 'error',
				message: translate('dialog.bone_config.custom_name.invalid_json.error', e.message),
			}
		}

		return { type: 'success', message: '' }
	}
</script>

<div>Hello, World!</div>

<style>
</style>

<script lang="ts">
	import Checkbox from '@svelte-components/dialog-items/checkbox.svelte'
	import ColorPicker from '@svelte-components/dialog-items/colorPicker.svelte'
	import LineInput from '@svelte-components/dialog-items/lineInput.svelte'
	import NumberSlider from '@svelte-components/dialog-items/numberSlider.svelte'
	import Select from '@svelte-components/dialog-items/select.svelte'

	import { Valuable } from '../../../util/stores'
	import { translate } from '../../../util/translation'

	import { JsonText } from '@aj/systems/minecraft-temp/jsonText'
	import { CommonDisplayConfig } from '@aj/systems/node-configs'
	import { NbtCompound, NbtTag } from 'deepslate/lib/nbt'

	const IS_PLUGIN_MODE = Project?.animated_java?.environment === 'plugin'

	export let customName: Valuable<string>
	export let customNameVisible: Valuable<boolean>
	export let billboard: Valuable<string>
	export let overrideBrightness: Valuable<NonNullable<CommonDisplayConfig['_overrideBrightness']>>
	export let brightnessOverride: Valuable<NonNullable<CommonDisplayConfig['_brightnessOverride']>>
	export let glowing: Valuable<NonNullable<CommonDisplayConfig['_glowing']>>
	export let overrideGlowColor: Valuable<NonNullable<CommonDisplayConfig['_overrideGlowColor']>>
	export let glowColor: Valuable<NonNullable<CommonDisplayConfig['_glowColor']>>
	export let invisible: Valuable<NonNullable<CommonDisplayConfig['_invisible']>>
	export let nbt: Valuable<NonNullable<CommonDisplayConfig['_nbt']>>
	export let shadowRadius: Valuable<NonNullable<CommonDisplayConfig['_shadowRadius']>>
	export let shadowStrength: Valuable<NonNullable<CommonDisplayConfig['_shadowStrength']>>
	export let useNBT: Valuable<NonNullable<CommonDisplayConfig['_useNBT']>>

	const BILLBOARD_OPTIONS: Record<CommonDisplayConfig['billboard'], string> = {
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

<div>
	{#if IS_PLUGIN_MODE}
		<Select
			label={translate('dialog.bone_config.billboard.title')}
			tooltip={translate('dialog.bone_config.billboard.description')}
			options={BILLBOARD_OPTIONS}
			defaultOption={CommonDisplayConfig.prototype.billboard}
			bind:value={billboard}
		/>

		<LineInput
			label={translate('dialog.bone_config.custom_name.title')}
			tooltip={translate('dialog.bone_config.custom_name.description')}
			bind:value={customName}
			defaultValue={CommonDisplayConfig.prototype.customName}
			valueChecker={customNameChecker}
		/>

		<Checkbox
			label={translate('dialog.bone_config.custom_name_visible.title')}
			tooltip={translate('dialog.bone_config.custom_name_visible.description')}
			bind:checked={customNameVisible}
			defaultValue={CommonDisplayConfig.prototype.customNameVisible}
		/>

		<Checkbox
			label={translate('dialog.bone_config.glowing.title')}
			tooltip={translate('dialog.bone_config.glowing.description')}
			bind:checked={glowing}
			defaultValue={CommonDisplayConfig.prototype.glowing}
		/>

		<ColorPicker
			label={translate('dialog.bone_config.glow_color.title')}
			tooltip={translate('dialog.bone_config.glow_color.description')}
			bind:value={glowColor}
		/>

		<NumberSlider
			label={translate('dialog.bone_config.shadow_radius.title')}
			tooltip={translate('dialog.bone_config.shadow_radius.description')}
			bind:value={shadowRadius}
			defaultValue={CommonDisplayConfig.prototype.shadowRadius}
			min={0}
			max={64}
		/>

		<NumberSlider
			label={translate('dialog.bone_config.shadow_strength.title')}
			tooltip={translate('dialog.bone_config.shadow_strength.description')}
			bind:value={shadowStrength}
			defaultValue={CommonDisplayConfig.prototype.shadowStrength}
			min={0}
		/>

		<Checkbox
			label={translate('dialog.bone_config.use_custom_brightness.title')}
			tooltip={translate('dialog.bone_config.use_custom_brightness.description')}
			bind:checked={overrideBrightness}
			defaultValue={CommonDisplayConfig.prototype.overrideBrightness}
		/>

		<NumberSlider
			label={translate('dialog.bone_config.custom_brightness.title')}
			tooltip={translate('dialog.bone_config.custom_brightness.description')}
			bind:value={brightnessOverride}
			defaultValue={CommonDisplayConfig.prototype.brightnessOverride}
			min={0}
			max={15}
		/>

		<Checkbox
			label={translate('dialog.bone_config.invisible.title')}
			tooltip={translate('dialog.bone_config.invisible.description')}
			bind:checked={invisible}
			defaultValue={CommonDisplayConfig.prototype.invisible}
		/>
	{:else}
		<Checkbox
			label={translate('dialog.bone_config.use_nbt.title')}
			tooltip={translate('dialog.bone_config.use_nbt.description')}
			bind:checked={useNBT}
			defaultValue={CommonDisplayConfig.prototype.useNBT}
		/>

		{#if $useNBT}
			<p class="use_nbt_warning">
				{translate('dialog.bone_config.use_nbt.use_nbt_warning')}
			</p>
			<LineInput
				label={translate('dialog.bone_config.nbt.title')}
				tooltip={translate('dialog.bone_config.nbt.description')}
				bind:value={nbt}
				defaultValue={CommonDisplayConfig.prototype.nbt}
				valueChecker={nbtChecker}
			/>
		{:else}
			<LineInput
				label={translate('dialog.bone_config.custom_name.title')}
				tooltip={translate('dialog.bone_config.custom_name.description')}
				bind:value={customName}
				defaultValue={CommonDisplayConfig.prototype.customName}
				valueChecker={customNameChecker}
			/>

			<Checkbox
				label={translate('dialog.bone_config.custom_name_visible.title')}
				tooltip={translate('dialog.bone_config.custom_name_visible.description')}
				bind:checked={customNameVisible}
				defaultValue={CommonDisplayConfig.prototype.customNameVisible}
			/>

			<Select
				label={translate('dialog.bone_config.billboard.title')}
				tooltip={translate('dialog.bone_config.billboard.description')}
				options={BILLBOARD_OPTIONS}
				defaultOption={CommonDisplayConfig.prototype.billboard}
				bind:value={billboard}
			/>

			<Checkbox
				label={translate('dialog.bone_config.glowing.title')}
				tooltip={translate('dialog.bone_config.glowing.description')}
				bind:checked={glowing}
				defaultValue={CommonDisplayConfig.prototype.glowing}
			/>

			<Checkbox
				label={translate('dialog.bone_config.override_glow_color.title')}
				tooltip={translate('dialog.bone_config.override_glow_color.description')}
				bind:checked={overrideGlowColor}
				defaultValue={CommonDisplayConfig.prototype.overrideGlowColor}
			/>

			{#if $overrideGlowColor}
				<ColorPicker
					label={translate('dialog.bone_config.glow_color.title')}
					tooltip={translate('dialog.bone_config.glow_color.description')}
					bind:value={glowColor}
				/>
			{/if}

			<NumberSlider
				label={translate('dialog.bone_config.shadow_radius.title')}
				tooltip={translate('dialog.bone_config.shadow_radius.description')}
				bind:value={shadowRadius}
				defaultValue={CommonDisplayConfig.prototype.shadowRadius}
				min={0}
				max={15}
			/>

			<NumberSlider
				label={translate('dialog.bone_config.shadow_strength.title')}
				tooltip={translate('dialog.bone_config.shadow_strength.description')}
				bind:value={shadowStrength}
				defaultValue={CommonDisplayConfig.prototype.shadowStrength}
				min={0}
				max={15}
			/>

			<Checkbox
				label={translate('dialog.bone_config.override_brightness.title')}
				tooltip={translate('dialog.bone_config.override_brightness.description')}
				bind:checked={overrideBrightness}
				defaultValue={CommonDisplayConfig.prototype.overrideBrightness}
			/>

			{#if $overrideBrightness}
				<NumberSlider
					label={translate('dialog.bone_config.brightness_override.title')}
					tooltip={translate('dialog.bone_config.brightness_override.description')}
					bind:value={brightnessOverride}
					defaultValue={CommonDisplayConfig.prototype.brightnessOverride}
					min={0}
					max={15}
				/>
			{/if}

			<!-- <Checkbox
				label={translate('dialog.bone_config.invisible.title')}
				tooltip={translate('dialog.bone_config.invisible.description')}
				bind:checked={invisible}
			/> -->
		{/if}
	{/if}
</div>

<style>
</style>

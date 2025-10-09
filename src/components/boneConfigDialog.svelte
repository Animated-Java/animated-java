<script lang="ts" , context="module">
	import Checkbox from './dialogItems/checkbox.svelte'
	import ColorPicker from './dialogItems/colorPicker.svelte'
	import NumberSlider from './dialogItems/numberSlider.svelte'
	import Select from './dialogItems/select.svelte'

	import { NbtCompound, NbtTag } from 'deepslate/lib/nbt'
	import { BoneConfig } from '../nodeConfigs'
	import { JsonText } from '../systems/jsonText'
	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'
	import { Variant } from '../variants'

	const BILLBOARD_OPTIONS: Record<BoneConfig['billboard'], string> = {
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
			JsonText.fromString(value, {
				minecraftVersion: Project!.animated_java.target_minecraft_version,
			})
		} catch (e: any) {
			return {
				type: 'error',
				message: e.message,
			}
		}

		return { type: 'success', message: '' }
	}
</script>

<script lang="ts">
	import CodeInput from './dialogItems/codeInput.svelte'

	const PLUGIN_MODE = !!Project?.animated_java?.enable_plugin_mode

	export let variant: Variant

	export let customName: Valuable<string>
	export let customNameVisible: Valuable<boolean>
	export let billboard: Valuable<string>
	export let overrideBrightness: Valuable<NonNullable<BoneConfig['__overrideBrightness']>>
	export let brightnessOverride: Valuable<NonNullable<BoneConfig['__brightnessOverride']>>
	export let enchanted: Valuable<NonNullable<BoneConfig['__enchanted']>>
	export let glowing: Valuable<NonNullable<BoneConfig['__glowing']>>
	export let overrideGlowColor: Valuable<NonNullable<BoneConfig['__overrideGlowColor']>>
	export let glowColor: Valuable<NonNullable<BoneConfig['__glowColor']>>
	export let inheritSettings: Valuable<NonNullable<BoneConfig['__inheritSettings']>>
	export let invisible: Valuable<NonNullable<BoneConfig['__invisible']>>
	export let nbt: Valuable<NonNullable<BoneConfig['__nbt']>>
	export let shadowRadius: Valuable<NonNullable<BoneConfig['__shadowRadius']>>
	export let shadowStrength: Valuable<NonNullable<BoneConfig['__shadowStrength']>>
	export let useNBT: Valuable<NonNullable<BoneConfig['__useNBT']>>
</script>

<div class="selected_variant_title">
	{translate('dialog.bone_config.selected_variant', variant.displayName)}
</div>
{#if variant.isDefault}
	<div class="selected_variant_subtitle">
		{translate('dialog.bone_config.default_variant_subtitle')}
	</div>
{:else}
	<div class="selected_variant_subtitle">
		{translate('dialog.bone_config.selected_variant_subtitle')}
	</div>
{/if}

{#if PLUGIN_MODE}
	<Checkbox
		label={translate('dialog.bone_config.inherit_settings.title')}
		tooltip={translate('dialog.bone_config.inherit_settings.description')}
		bind:checked={inheritSettings}
		defaultValue={BoneConfig.prototype.inheritSettings}
	/>

	<CodeInput
		label={translate('dialog.bone_config.custom_name.title')}
		tooltip={translate('dialog.bone_config.custom_name.description')}
		bind:value={customName}
		defaultValue={BoneConfig.prototype.customName}
		valueChecker={customNameChecker}
		syntax="snbtTextComponent"
	/>

	<Checkbox
		label={translate('dialog.bone_config.custom_name_visible.title')}
		tooltip={translate('dialog.bone_config.custom_name_visible.description')}
		bind:checked={customNameVisible}
		defaultValue={BoneConfig.prototype.customNameVisible}
	/>

	<Select
		label={translate('dialog.bone_config.billboard.title')}
		tooltip={translate('dialog.bone_config.billboard.description')}
		options={BILLBOARD_OPTIONS}
		defaultOption={BoneConfig.prototype.billboard}
		bind:value={billboard}
	/>

	<Checkbox
		label={translate('dialog.bone_config.glowing.title')}
		tooltip={translate('dialog.bone_config.glowing.description')}
		bind:checked={glowing}
		defaultValue={BoneConfig.prototype.glowing}
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
		defaultValue={BoneConfig.prototype.shadowRadius}
		min={0}
		max={64}
	/>

	<NumberSlider
		label={translate('dialog.bone_config.shadow_strength.title')}
		tooltip={translate('dialog.bone_config.shadow_strength.description')}
		bind:value={shadowStrength}
		defaultValue={BoneConfig.prototype.shadowStrength}
		min={0}
	/>

	<Checkbox
		label={translate('dialog.bone_config.use_custom_brightness.title')}
		tooltip={translate('dialog.bone_config.use_custom_brightness.description')}
		bind:checked={overrideBrightness}
		defaultValue={BoneConfig.prototype.overrideBrightness}
	/>

	<NumberSlider
		label={translate('dialog.bone_config.custom_brightness.title')}
		tooltip={translate('dialog.bone_config.custom_brightness.description')}
		bind:value={brightnessOverride}
		defaultValue={BoneConfig.prototype.brightnessOverride}
		min={0}
		max={15}
		valueStep={1}
	/>

	<Checkbox
		label={translate('dialog.bone_config.enchanted.title')}
		tooltip={translate('dialog.bone_config.enchanted.description')}
		bind:checked={enchanted}
		defaultValue={BoneConfig.prototype.enchanted}
	/>

	<Checkbox
		label={translate('dialog.bone_config.invisible.title')}
		tooltip={translate('dialog.bone_config.invisible.description')}
		bind:checked={invisible}
		defaultValue={BoneConfig.prototype.invisible}
	/>
{:else}
	<Checkbox
		label={translate('dialog.bone_config.inherit_settings.title')}
		tooltip={translate('dialog.bone_config.inherit_settings.description')}
		bind:checked={inheritSettings}
		defaultValue={BoneConfig.prototype.inheritSettings}
	/>

	<CodeInput
		label={translate('dialog.bone_config.custom_name.title')}
		tooltip={translate('dialog.bone_config.custom_name.description')}
		bind:value={customName}
		defaultValue={BoneConfig.prototype.customName}
		valueChecker={customNameChecker}
		syntax="snbtTextComponent"
	/>

	<Checkbox
		label={translate('dialog.bone_config.custom_name_visible.title')}
		tooltip={translate('dialog.bone_config.custom_name_visible.description')}
		bind:checked={customNameVisible}
		defaultValue={BoneConfig.prototype.customNameVisible}
	/>

	<Checkbox
		label={translate('dialog.bone_config.use_nbt.title')}
		tooltip={translate('dialog.bone_config.use_nbt.description')}
		bind:checked={useNBT}
		defaultValue={BoneConfig.prototype.useNBT}
	/>

	{#if $useNBT}
		<p class="use_nbt_warning">
			{translate('dialog.bone_config.use_nbt.use_nbt_warning')}
		</p>
		<CodeInput
			label={translate('dialog.bone_config.nbt.title')}
			tooltip={translate('dialog.bone_config.nbt.description')}
			bind:value={nbt}
			defaultValue={BoneConfig.prototype.nbt}
			valueChecker={nbtChecker}
			syntax="snbtTextComponent"
		/>
	{:else}
		<Select
			label={translate('dialog.bone_config.billboard.title')}
			tooltip={translate('dialog.bone_config.billboard.description')}
			options={BILLBOARD_OPTIONS}
			defaultOption={BoneConfig.prototype.billboard}
			bind:value={billboard}
		/>

		<Checkbox
			label={translate('dialog.bone_config.glowing.title')}
			tooltip={translate('dialog.bone_config.glowing.description')}
			bind:checked={glowing}
			defaultValue={BoneConfig.prototype.glowing}
		/>

		<Checkbox
			label={translate('dialog.bone_config.override_glow_color.title')}
			tooltip={translate('dialog.bone_config.override_glow_color.description')}
			bind:checked={overrideGlowColor}
			defaultValue={BoneConfig.prototype.overrideGlowColor}
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
			defaultValue={BoneConfig.prototype.shadowRadius}
			min={0}
			max={15}
		/>

		<NumberSlider
			label={translate('dialog.bone_config.shadow_strength.title')}
			tooltip={translate('dialog.bone_config.shadow_strength.description')}
			bind:value={shadowStrength}
			defaultValue={BoneConfig.prototype.shadowStrength}
			min={0}
			max={15}
		/>

		<Checkbox
			label={translate('dialog.bone_config.override_brightness.title')}
			tooltip={translate('dialog.bone_config.override_brightness.description')}
			bind:checked={overrideBrightness}
			defaultValue={BoneConfig.prototype.overrideBrightness}
		/>

		{#if $overrideBrightness}
			<NumberSlider
				label={translate('dialog.bone_config.brightness_override.title')}
				tooltip={translate('dialog.bone_config.brightness_override.description')}
				bind:value={brightnessOverride}
				defaultValue={BoneConfig.prototype.brightnessOverride}
				min={0}
				max={15}
				valueStep={1}
			/>
		{/if}

		<Checkbox
			label={translate('dialog.bone_config.enchanted.title')}
			tooltip={translate('dialog.bone_config.enchanted.description')}
			bind:checked={enchanted}
			defaultValue={BoneConfig.prototype.enchanted}
		/>

		<!-- <Checkbox
			label={translate('dialog.bone_config.invisible.title')}
			tooltip={translate('dialog.bone_config.invisible.description')}
			bind:checked={invisible}
		/> -->
	{/if}
{/if}

<style>
	.use_nbt_warning {
		color: var(--color-warning);
		margin: 0px 18px 16px;
		font-size: small;
	}
	.selected_variant_title {
		font-size: 1.2em;
		margin-bottom: 8px;
	}
	.selected_variant_subtitle {
		text-align: center;
		font-size: 0.8em;
		margin-bottom: 8px;
	}
</style>

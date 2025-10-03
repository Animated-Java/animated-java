<script lang="ts" , context="module">
	import Checkbox from './dialogItems/checkbox.svelte'
	import CodeInput from './dialogItems/codeInput.svelte'
	import ColorPicker from './dialogItems/colorPicker.svelte'
	import NumberSlider from './dialogItems/numberSlider.svelte'
	import Select from './dialogItems/select.svelte'

	import { NbtCompound, NbtTag } from 'deepslate/lib/nbt'
	import { TextDisplayConfig } from '../nodeConfigs'
	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'
</script>

<script lang="ts">
	const pluginModeEnabled = !!Project?.animated_java?.enable_plugin_mode

	export let billboard: Valuable<string>
	export let overrideBrightness: Valuable<NonNullable<TextDisplayConfig['_overrideBrightness']>>
	export let brightnessOverride: Valuable<NonNullable<TextDisplayConfig['_brightnessOverride']>>
	export let glowing: Valuable<NonNullable<TextDisplayConfig['_glowing']>>
	export let overrideGlowColor: Valuable<NonNullable<TextDisplayConfig['_overrideGlowColor']>>
	export let glowColor: Valuable<NonNullable<TextDisplayConfig['_glowColor']>>
	export let invisible: Valuable<NonNullable<TextDisplayConfig['_invisible']>>
	export let nbt: Valuable<NonNullable<TextDisplayConfig['_nbt']>>
	export let shadowRadius: Valuable<NonNullable<TextDisplayConfig['_shadowRadius']>>
	export let shadowStrength: Valuable<NonNullable<TextDisplayConfig['_shadowStrength']>>
	export let useNBT: Valuable<NonNullable<TextDisplayConfig['_useNBT']>>

	const billboardOptions: Record<TextDisplayConfig['billboard'], string> = {
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
</script>

{#if pluginModeEnabled}
	<Select
		label={translate('dialog.text_display_config.billboard.title')}
		tooltip={translate('dialog.text_display_config.billboard.description')}
		options={billboardOptions}
		defaultOption={TextDisplayConfig.prototype.billboard}
		bind:value={billboard}
	/>

	<Checkbox
		label={translate('dialog.text_display_config.glowing.title')}
		tooltip={translate('dialog.text_display_config.glowing.description')}
		bind:checked={glowing}
		defaultValue={TextDisplayConfig.prototype.glowing}
	/>

	<ColorPicker
		label={translate('dialog.text_display_config.glow_color.title')}
		tooltip={translate('dialog.text_display_config.glow_color.description')}
		bind:value={glowColor}
	/>

	<NumberSlider
		label={translate('dialog.text_display_config.shadow_radius.title')}
		tooltip={translate('dialog.text_display_config.shadow_radius.description')}
		bind:value={shadowRadius}
		defaultValue={TextDisplayConfig.prototype.shadowRadius}
		min={0}
		max={64}
	/>

	<NumberSlider
		label={translate('dialog.text_display_config.shadow_strength.title')}
		tooltip={translate('dialog.text_display_config.shadow_strength.description')}
		bind:value={shadowStrength}
		defaultValue={TextDisplayConfig.prototype.shadowStrength}
		min={0}
	/>

	<Checkbox
		label={translate('dialog.bone_config.use_custom_brightness.title')}
		tooltip={translate('dialog.bone_config.use_custom_brightness.description')}
		bind:checked={overrideBrightness}
		defaultValue={TextDisplayConfig.prototype.overrideBrightness}
	/>

	<NumberSlider
		label={translate('dialog.bone_config.custom_brightness.title')}
		tooltip={translate('dialog.bone_config.custom_brightness.description')}
		bind:value={brightnessOverride}
		defaultValue={TextDisplayConfig.prototype.brightnessOverride}
		min={0}
		max={15}
		valueStep={1}
	/>

	<Checkbox
		label={translate('dialog.text_display_config.invisible.title')}
		tooltip={translate('dialog.text_display_config.invisible.description')}
		bind:checked={invisible}
		defaultValue={TextDisplayConfig.prototype.invisible}
	/>
{:else}
	<Checkbox
		label={translate('dialog.text_display_config.use_nbt.title')}
		tooltip={translate('dialog.text_display_config.use_nbt.description')}
		bind:checked={useNBT}
		defaultValue={TextDisplayConfig.prototype.useNBT}
	/>

	{#if $useNBT}
		<p class="use_nbt_warning">
			{translate('dialog.text_display_config.use_nbt.use_nbt_warning')}
		</p>
		<CodeInput
			label={translate('dialog.text_display_config.nbt.title')}
			tooltip={translate('dialog.text_display_config.nbt.description')}
			bind:value={nbt}
			defaultValue={TextDisplayConfig.prototype.nbt}
			valueChecker={nbtChecker}
			syntax="snbtTextComponent"
		/>
	{:else}
		<Select
			label={translate('dialog.bone_config.billboard.title')}
			tooltip={translate('dialog.bone_config.billboard.description')}
			options={billboardOptions}
			defaultOption={TextDisplayConfig.prototype.billboard}
			bind:value={billboard}
		/>

		<Checkbox
			label={translate('dialog.text_display_config.glowing.title')}
			tooltip={translate('dialog.text_display_config.glowing.description')}
			bind:checked={glowing}
			defaultValue={TextDisplayConfig.prototype.glowing}
		/>

		<Checkbox
			label={translate('dialog.text_display_config.override_glow_color.title')}
			tooltip={translate('dialog.text_display_config.override_glow_color.description')}
			bind:checked={overrideGlowColor}
			defaultValue={TextDisplayConfig.prototype.overrideGlowColor}
		/>

		{#if $overrideGlowColor}
			<ColorPicker
				label={translate('dialog.text_display_config.glow_color.title')}
				tooltip={translate('dialog.text_display_config.glow_color.description')}
				bind:value={glowColor}
			/>
		{/if}

		<NumberSlider
			label={translate('dialog.text_display_config.shadow_radius.title')}
			tooltip={translate('dialog.text_display_config.shadow_radius.description')}
			bind:value={shadowRadius}
			defaultValue={TextDisplayConfig.prototype.shadowRadius}
			min={0}
			max={15}
		/>

		<NumberSlider
			label={translate('dialog.text_display_config.shadow_strength.title')}
			tooltip={translate('dialog.text_display_config.shadow_strength.description')}
			bind:value={shadowStrength}
			defaultValue={TextDisplayConfig.prototype.shadowStrength}
			min={0}
			max={15}
		/>

		<Checkbox
			label={translate('dialog.text_display_config.override_brightness.title')}
			tooltip={translate('dialog.text_display_config.override_brightness.description')}
			bind:checked={overrideBrightness}
			defaultValue={TextDisplayConfig.prototype.overrideBrightness}
		/>

		{#if $overrideBrightness}
			<NumberSlider
				label={translate('dialog.text_display_config.brightness_override.title')}
				tooltip={translate('dialog.text_display_config.brightness_override.description')}
				bind:value={brightnessOverride}
				defaultValue={TextDisplayConfig.prototype.brightnessOverride}
				min={0}
				max={15}
				valueStep={1}
			/>
		{/if}

		<!-- <Checkbox
				label={translate('dialog.text_display_config.invisible.title')}
				tooltip={translate('dialog.text_display_config.invisible.description')}
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
</style>

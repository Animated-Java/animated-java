<script lang="ts" , context="module">
	import Checkbox from './dialogItems/checkbox.svelte'
	import NumberSlider from './dialogItems/numberSlider.svelte'
	import LineInput from './dialogItems/lineInput.svelte'
	import ColorPicker from './dialogItems/colorPicker.svelte'

	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'
	import { Variant } from '../variants'
</script>

<script lang="ts">
	import { BoneConfig } from '../boneConfig'
	import Select from './dialogItems/select.svelte'

	const pluginModeEnabled = !!Project?.animated_java?.enable_plugin_mode

	export let variant: Variant

	export let billboard: Valuable<string>
	export let overrideBrightness: Valuable<boolean>
	export let brightnessOverride: Valuable<BoneConfig['brightnessOverride']>
	export let enchanted: Valuable<BoneConfig['enchanted']>
	export let glowing: Valuable<BoneConfig['glowing']>
	export let overrideGlowColor: Valuable<boolean>
	export let glowColor: Valuable<BoneConfig['glowColor']>
	export let inheritSettings: Valuable<BoneConfig['inheritSettings']>
	export let invisible: Valuable<BoneConfig['invisible']>
	export let nbt: Valuable<BoneConfig['nbt']>
	export let shadowRadius: Valuable<BoneConfig['shadowRadius']>
	export let shadowStrength: Valuable<BoneConfig['shadowStrength']>
	export let useNBT: Valuable<BoneConfig['useNBT']>

	const billboardOptions: Record<BoneConfig['billboard'], string> = {
		fixed: translate('dialog.bone_config.billboard.options.fixed'),
		vertical: translate('dialog.bone_config.billboard.options.vertical'),
		horizontal: translate('dialog.bone_config.billboard.options.horizontal'),
		center: translate('dialog.bone_config.billboard.options.center'),
	}
</script>

<div>
	<div class="selected_variant_title">
		Selected Variant: {variant.displayName}
	</div>
	{#if variant.isDefault}
		<div class="selected_variant_subtitle">
			The settings below will be applied to this bone by default.
		</div>
	{:else}
		<div class="selected_variant_subtitle">
			The settings below will be applied to this bone only when this variant is applied.
		</div>
	{/if}

	{#if pluginModeEnabled}
		<Checkbox
			label={translate('dialog.bone_config.inherit_settings.title')}
			tooltip={translate('dialog.bone_config.inherit_settings.description')}
			bind:checked={inheritSettings}
		/>

		<Select
			label={translate('dialog.bone_config.billboard.title')}
			tooltip={translate('dialog.bone_config.billboard.description')}
			options={billboardOptions}
			defaultOption={BoneConfig.prototype.billboard}
			bind:value={billboard}
		/>

		<Checkbox
			label={translate('dialog.bone_config.glowing.title')}
			tooltip={translate('dialog.bone_config.glowing.description')}
			bind:checked={glowing}
		/>

		<Checkbox
			label={translate('dialog.bone_config.override_glow_color.title')}
			tooltip={translate('dialog.bone_config.override_glow_color.description')}
			bind:checked={overrideGlowColor}
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
			min={0}
			max={64}
		/>

		<NumberSlider
			label={translate('dialog.bone_config.shadow_strength.title')}
			tooltip={translate('dialog.bone_config.shadow_strength.description')}
			bind:value={shadowStrength}
			min={0}
		/>

		<Checkbox
			label={translate('dialog.bone_config.override_brightness.title')}
			tooltip={translate('dialog.bone_config.override_brightness.description')}
			bind:checked={overrideBrightness}
		/>

		{#if $overrideBrightness}
			<NumberSlider
				label={translate('dialog.bone_config.brightness_override.title')}
				tooltip={translate('dialog.bone_config.brightness_override.description')}
				bind:value={brightnessOverride}
				min={0}
				max={15}
			/>
		{/if}

		<Checkbox
			label={translate('dialog.bone_config.enchanted.title')}
			tooltip={translate('dialog.bone_config.enchanted.description')}
			bind:checked={enchanted}
		/>

		<Checkbox
			label={translate('dialog.bone_config.invisible.title')}
			tooltip={translate('dialog.bone_config.invisible.description')}
			bind:checked={invisible}
		/>
	{:else}
		<Checkbox
			label={translate('dialog.bone_config.inherit_settings.title')}
			tooltip={translate('dialog.bone_config.inherit_settings.description')}
			bind:checked={inheritSettings}
		/>

		<Checkbox
			label={translate('dialog.bone_config.use_nbt.title')}
			tooltip={translate('dialog.bone_config.use_nbt.description')}
			bind:checked={useNBT}
		/>

		{#if $useNBT}
			<p class="use_nbt_warning">
				{translate('dialog.bone_config.use_nbt.use_nbt_warning')}
			</p>
			<LineInput
				label={translate('dialog.bone_config.nbt.title')}
				tooltip={translate('dialog.bone_config.nbt.description')}
				bind:value={nbt}
			/>
		{:else}
			<Select
				label={translate('dialog.bone_config.billboard.title')}
				tooltip={translate('dialog.bone_config.billboard.description')}
				options={billboardOptions}
				defaultOption={BoneConfig.prototype.billboard}
				bind:value={billboard}
			/>

			<Checkbox
				label={translate('dialog.bone_config.glowing.title')}
				tooltip={translate('dialog.bone_config.glowing.description')}
				bind:checked={glowing}
			/>

			<Checkbox
				label={translate('dialog.bone_config.override_glow_color.title')}
				tooltip={translate('dialog.bone_config.override_glow_color.description')}
				bind:checked={overrideGlowColor}
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
				min={0}
				max={15}
			/>

			<NumberSlider
				label={translate('dialog.bone_config.shadow_strength.title')}
				tooltip={translate('dialog.bone_config.shadow_strength.description')}
				bind:value={shadowStrength}
				min={0}
				max={15}
			/>

			<Checkbox
				label={translate('dialog.bone_config.override_brightness.title')}
				tooltip={translate('dialog.bone_config.override_brightness.description')}
				bind:checked={overrideBrightness}
			/>

			{#if $overrideBrightness}
				<NumberSlider
					label={translate('dialog.bone_config.brightness_override.title')}
					tooltip={translate('dialog.bone_config.brightness_override.description')}
					bind:value={brightnessOverride}
					min={0}
					max={15}
				/>
			{/if}

			<Checkbox
				label={translate('dialog.bone_config.enchanted.title')}
				tooltip={translate('dialog.bone_config.enchanted.description')}
				bind:checked={enchanted}
			/>

			<Checkbox
				label={translate('dialog.bone_config.invisible.title')}
				tooltip={translate('dialog.bone_config.invisible.description')}
				bind:checked={invisible}
			/>
		{/if}
	{/if}
</div>

<style>
	.use_nbt_warning {
		color: var(--color-warning);
		font-family: var(--font-code);
		font-size: 0.8em;
		margin-bottom: 8px;
	}
	.selected_variant_title {
		text-align: center;
		font-size: 1.2em;
		margin-bottom: 8px;
	}
	.selected_variant_subtitle {
		text-align: center;
		font-size: 0.8em;
		margin-bottom: 8px;
	}
</style>

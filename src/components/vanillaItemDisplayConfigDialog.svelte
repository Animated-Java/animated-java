<script lang="ts" , context="module">
	import Checkbox from './dialogItems/checkbox.svelte'
	import NumberSlider from './dialogItems/numberSlider.svelte'
	import LineInput from './dialogItems/lineInput.svelte'
	import ColorPicker from './dialogItems/colorPicker.svelte'
	import Select from './dialogItems/select.svelte'

	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'
	import { BoneConfig } from '../nodeConfigs'
</script>

<script lang="ts">
	const pluginModeEnabled = !!Project?.animated_java?.enable_plugin_mode

	export let billboard: Valuable<string>
	export let overrideBrightness: Valuable<NonNullable<BoneConfig['_overrideBrightness']>>
	export let brightnessOverride: Valuable<NonNullable<BoneConfig['_brightnessOverride']>>
	export let glowing: Valuable<NonNullable<BoneConfig['_glowing']>>
	export let overrideGlowColor: Valuable<NonNullable<BoneConfig['_overrideGlowColor']>>
	export let glowColor: Valuable<NonNullable<BoneConfig['_glowColor']>>
	export let invisible: Valuable<NonNullable<BoneConfig['_invisible']>>
	export let nbt: Valuable<NonNullable<BoneConfig['_nbt']>>
	export let shadowRadius: Valuable<NonNullable<BoneConfig['_shadowRadius']>>
	export let shadowStrength: Valuable<NonNullable<BoneConfig['_shadowStrength']>>
	export let useNBT: Valuable<NonNullable<BoneConfig['_useNBT']>>

	const billboardOptions: Record<BoneConfig['billboard'], string> = {
		fixed: translate('dialog.bone_config.billboard.options.fixed'),
		vertical: translate('dialog.bone_config.billboard.options.vertical'),
		horizontal: translate('dialog.bone_config.billboard.options.horizontal'),
		center: translate('dialog.bone_config.billboard.options.center'),
	}
</script>

<div>
	{#if pluginModeEnabled}
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
			label={translate('dialog.bone_config.invisible.title')}
			tooltip={translate('dialog.bone_config.invisible.description')}
			bind:checked={invisible}
		/>
	{:else}
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
				label={translate('dialog.bone_config.invisible.title')}
				tooltip={translate('dialog.bone_config.invisible.description')}
				bind:checked={invisible}
			/>
		{/if}
	{/if}
</div>

<style>
</style>

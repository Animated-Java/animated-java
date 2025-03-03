<script lang="ts">
	import Checkbox from '@svelte-components/dialog-items/checkbox.svelte'
	import ColorPicker from '@svelte-components/dialog-items/colorPicker.svelte'
	import LineInput from '@svelte-components/dialog-items/lineInput.svelte'
	import NumberSlider from '@svelte-components/dialog-items/numberSlider.svelte'
	import Select from '@svelte-components/dialog-items/select.svelte'

	import { TextDisplayConfig } from '@aj/systems/node-configs'
	import { Syncable } from '../../../util/stores'
	import { translate } from '../../../util/translation'

	const IS_PLUGIN_MODE = Project?.animated_java?.environment === 'plugin'

	export let billboard: Syncable<string>
	export let overrideBrightness: Syncable<NonNullable<TextDisplayConfig['_overrideBrightness']>>
	export let brightnessOverride: Syncable<NonNullable<TextDisplayConfig['_brightnessOverride']>>
	export let glowing: Syncable<NonNullable<TextDisplayConfig['_glowing']>>
	export let overrideGlowColor: Syncable<NonNullable<TextDisplayConfig['_overrideGlowColor']>>
	export let glowColor: Syncable<NonNullable<TextDisplayConfig['_glowColor']>>
	export let invisible: Syncable<NonNullable<TextDisplayConfig['_invisible']>>
	export let nbt: Syncable<NonNullable<TextDisplayConfig['_nbt']>>
	export let shadowRadius: Syncable<NonNullable<TextDisplayConfig['_shadowRadius']>>
	export let shadowStrength: Syncable<NonNullable<TextDisplayConfig['_shadowStrength']>>
	export let useNBT: Syncable<NonNullable<TextDisplayConfig['_useNBT']>>

	const BILLBOARD_OPTIONS: Record<TextDisplayConfig['billboard'], string> = {
		fixed: translate('dialog.text_display_config.billboard.options.fixed'),
		vertical: translate('dialog.text_display_config.billboard.options.vertical'),
		horizontal: translate('dialog.text_display_config.billboard.options.horizontal'),
		center: translate('dialog.text_display_config.billboard.options.center'),
	}
</script>

<div>
	{#if IS_PLUGIN_MODE}
		<Select
			label={translate('dialog.text_display_config.billboard.title')}
			tooltip={translate('dialog.text_display_config.billboard.description')}
			options={BILLBOARD_OPTIONS}
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
			<LineInput
				label={translate('dialog.text_display_config.nbt.title')}
				tooltip={translate('dialog.text_display_config.nbt.description')}
				bind:value={nbt}
				defaultValue={TextDisplayConfig.prototype.nbt}
			/>
		{:else}
			<Select
				label={translate('dialog.text_display_config.billboard.title')}
				tooltip={translate('dialog.text_display_config.billboard.description')}
				options={BILLBOARD_OPTIONS}
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
					tooltip={translate(
						'dialog.text_display_config.brightness_override.description'
					)}
					bind:value={brightnessOverride}
					defaultValue={TextDisplayConfig.prototype.brightnessOverride}
					min={0}
					max={15}
				/>
			{/if}

			<!-- <Checkbox
				label={translate('dialog.text_display_config.invisible.title')}
				tooltip={translate('dialog.text_display_config.invisible.description')}
				bind:checked={invisible}
			/> -->
		{/if}
	{/if}
</div>

<style>
</style>

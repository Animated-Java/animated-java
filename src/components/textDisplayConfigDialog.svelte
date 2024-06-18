<script lang="ts" , context="module">
	import Checkbox from './dialogItems/checkbox.svelte'
	import NumberSlider from './dialogItems/numberSlider.svelte'
	import LineInput from './dialogItems/lineInput.svelte'
	import ColorPicker from './dialogItems/colorPicker.svelte'
	import Select from './dialogItems/select.svelte'

	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'
	import { TextDisplayConfig } from '../nodeConfigs'
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
		fixed: translate('dialog.text_display_config.billboard.options.fixed'),
		vertical: translate('dialog.text_display_config.billboard.options.vertical'),
		horizontal: translate('dialog.text_display_config.billboard.options.horizontal'),
		center: translate('dialog.text_display_config.billboard.options.center'),
	}
</script>

<div>
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
		/>

		<Checkbox
			label={translate('dialog.text_display_config.override_glow_color.title')}
			tooltip={translate('dialog.text_display_config.override_glow_color.description')}
			bind:checked={overrideGlowColor}
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
			min={0}
			max={64}
		/>

		<NumberSlider
			label={translate('dialog.text_display_config.shadow_strength.title')}
			tooltip={translate('dialog.text_display_config.shadow_strength.description')}
			bind:value={shadowStrength}
			min={0}
		/>

		<Checkbox
			label={translate('dialog.text_display_config.override_brightness.title')}
			tooltip={translate('dialog.text_display_config.override_brightness.description')}
			bind:checked={overrideBrightness}
		/>

		{#if $overrideBrightness}
			<NumberSlider
				label={translate('dialog.text_display_config.brightness_override.title')}
				tooltip={translate('dialog.text_display_config.brightness_override.description')}
				bind:value={brightnessOverride}
				min={0}
				max={15}
			/>
		{/if}

		<Checkbox
			label={translate('dialog.text_display_config.invisible.title')}
			tooltip={translate('dialog.text_display_config.invisible.description')}
			bind:checked={invisible}
		/>
	{:else}
		<Checkbox
			label={translate('dialog.text_display_config.use_nbt.title')}
			tooltip={translate('dialog.text_display_config.use_nbt.description')}
			bind:checked={useNBT}
		/>

		{#if $useNBT}
			<p class="use_nbt_warning">
				{translate('dialog.text_display_config.use_nbt.use_nbt_warning')}
			</p>
			<LineInput
				label={translate('dialog.text_display_config.nbt.title')}
				tooltip={translate('dialog.text_display_config.nbt.description')}
				bind:value={nbt}
			/>
		{:else}
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
			/>

			<Checkbox
				label={translate('dialog.text_display_config.override_glow_color.title')}
				tooltip={translate('dialog.text_display_config.override_glow_color.description')}
				bind:checked={overrideGlowColor}
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
				min={0}
				max={15}
			/>

			<NumberSlider
				label={translate('dialog.text_display_config.shadow_strength.title')}
				tooltip={translate('dialog.text_display_config.shadow_strength.description')}
				bind:value={shadowStrength}
				min={0}
				max={15}
			/>

			<Checkbox
				label={translate('dialog.text_display_config.override_brightness.title')}
				tooltip={translate('dialog.text_display_config.override_brightness.description')}
				bind:checked={overrideBrightness}
			/>

			{#if $overrideBrightness}
				<NumberSlider
					label={translate('dialog.text_display_config.brightness_override.title')}
					tooltip={translate(
						'dialog.text_display_config.brightness_override.description',
					)}
					bind:value={brightnessOverride}
					min={0}
					max={15}
				/>
			{/if}

			<Checkbox
				label={translate('dialog.text_display_config.invisible.title')}
				tooltip={translate('dialog.text_display_config.invisible.description')}
				bind:checked={invisible}
			/>
		{/if}
	{/if}
</div>

<style>
</style>

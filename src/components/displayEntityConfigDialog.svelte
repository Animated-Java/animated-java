<script lang="ts" , context="module">
	import { type DisplayEntity } from 'src/interface/dialog/displayEntityConfig'
	import { TextDisplay } from 'src/outliner/textDisplay'
	import { type IDisplayEntityConfigs } from 'src/systems/rigRenderer'
	import { onDestroy } from 'svelte'
	import { type BillboardMode, DisplayEntityConfig } from '../nodeConfigs'
	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'
	import { Variant } from '../variants'
	import Checkbox from './dialogItems/checkbox.svelte'
	import CodeInput from './dialogItems/codeInput.svelte'
	import ColorPicker from './dialogItems/colorPicker.svelte'
	import NumberSlider from './dialogItems/numberSlider.svelte'
	import SectionHeader from './dialogItems/sectionHeader.svelte'
	import Select from './dialogItems/select.svelte'

	const BILLBOARD_OPTIONS: Record<DisplayEntityConfig['billboard'], string> = {
		fixed: translate('dialog.display_entity.billboard.options.fixed'),
		vertical: translate('dialog.display_entity.billboard.options.vertical'),
		horizontal: translate('dialog.display_entity.billboard.options.horizontal'),
		center: translate('dialog.display_entity.billboard.options.center'),
	}

	const DEFAULT_CONFIG = DisplayEntityConfig.getDefault()
</script>

<script lang="ts">
	export let displayEntity: DisplayEntity
	export let onSummonFunction: Valuable<string>
	export let configs: IDisplayEntityConfigs

	let onApplyFunction = new Valuable<string>(DEFAULT_CONFIG.onApplyFunction)

	let billboard = new Valuable<string>(DEFAULT_CONFIG.billboard)
	let overrideBrightness = new Valuable<boolean>(DEFAULT_CONFIG.overrideBrightness)
	let brightnessOverride = new Valuable<number>(DEFAULT_CONFIG.brightnessOverride)
	let enchanted = new Valuable<boolean>(DEFAULT_CONFIG.enchanted)
	let glowing = new Valuable<boolean>(DEFAULT_CONFIG.glowing)
	let overrideGlowColor = new Valuable<boolean>(DEFAULT_CONFIG.overrideGlowColor)
	let glowColor = new Valuable<string>(DEFAULT_CONFIG.glowColor)
	let invisible = new Valuable<boolean>(DEFAULT_CONFIG.invisible)
	let shadowRadius = new Valuable<number>(DEFAULT_CONFIG.shadowRadius)
	let shadowStrength = new Valuable<number>(DEFAULT_CONFIG.shadowStrength)

	let config: DisplayEntityConfig

	const loadConfig = (uuid: string) => {
		const variant = Variant.getByUUID(uuid)
		if (!variant) {
			console.error(`Variant with UUID ${uuid} not found`)
			return
		}
		if (variant.isDefault) {
			config = DisplayEntityConfig.fromJSON(configs.default)
		} else {
			config = DisplayEntityConfig.fromJSON(configs.variants[variant.uuid] ?? {})
		}
		$onApplyFunction = config.onApplyFunction
		$billboard = config.billboard
		$overrideBrightness = config.overrideBrightness
		$brightnessOverride = config.brightnessOverride
		$enchanted = config.enchanted
		$glowing = config.glowing
		$overrideGlowColor = config.overrideGlowColor
		$glowColor = config.glowColor
		$invisible = config.invisible
		$shadowRadius = config.shadowRadius
		$shadowStrength = config.shadowStrength
	}

	const saveConfig = (uuid: string) => {
		const variant = Variant.getByUUID(uuid)
		if (!variant) {
			console.error(`Variant with UUID ${uuid} not found`)
			return
		}
		if (variant.isDefault) {
			configs.default = config.toJSON()
		} else {
			configs.variants[variant.uuid] = config.toJSON()
		}
	}

	const OPTIONS = Object.fromEntries(
		Variant.all.map(variant => [variant.uuid, variant.displayName])
	)

	let variant = new Valuable(Variant.getDefault().uuid)

	$: {
		loadConfig($variant)
	}

	$: {
		config.onApplyFunction = $onApplyFunction
		config.billboard = $billboard as BillboardMode
		config.overrideBrightness = $overrideBrightness
		config.brightnessOverride = $brightnessOverride
		config.enchanted = $enchanted
		config.glowing = $glowing
		config.overrideGlowColor = $overrideGlowColor
		config.glowColor = $glowColor
		config.invisible = $invisible
		config.shadowRadius = $shadowRadius
		config.shadowStrength = $shadowStrength
		saveConfig($variant)
	}

	const SELECT_ELEMENT = new Interface.CustomElements.SelectInput(
		'animated-java:display-entity-variant-select',
		{
			options: OPTIONS,
			value: $variant,
			onChange(value) {
				$variant = value
			},
		}
	)

	const unsub = variant.subscribe(v => {
		SELECT_ELEMENT.set(v)
	})

	const mountVariantSelect = (node: HTMLDivElement) => {
		node.appendChild(SELECT_ELEMENT.node)
	}

	onDestroy(() => {
		unsub()
	})
</script>

<SectionHeader label={translate('dialog.display_entity.node_options.title')} />

<CodeInput
	label={translate('dialog.display_entity.on_summon_function.title')}
	tooltip={translate('dialog.display_entity.on_summon_function.description')}
	bind:value={onSummonFunction}
	defaultValue=""
/>

<SectionHeader label={translate('dialog.display_entity.per_variant_options.title')} />

<div class="variant-select" use:mountVariantSelect />

<hr />

<CodeInput
	label={translate('dialog.display_entity.on_apply_function.title')}
	tooltip={translate('dialog.display_entity.on_apply_function.description')}
	bind:value={onApplyFunction}
	defaultValue=""
/>

<Select
	label={translate('dialog.display_entity.billboard.title')}
	tooltip={translate('dialog.display_entity.billboard.description')}
	options={BILLBOARD_OPTIONS}
	defaultOption={DisplayEntityConfig.prototype.billboard}
	bind:value={billboard}
/>

<Checkbox
	label={translate('dialog.display_entity.override_brightness.title')}
	tooltip={translate('dialog.display_entity.override_brightness.description')}
	bind:checked={overrideBrightness}
	defaultValue={DisplayEntityConfig.prototype.overrideBrightness}
/>

{#if $overrideBrightness}
	<NumberSlider
		label={translate('dialog.display_entity.brightness_override.title')}
		tooltip={translate('dialog.display_entity.brightness_override.description')}
		bind:value={brightnessOverride}
		defaultValue={DisplayEntityConfig.prototype.brightnessOverride}
		min={0}
		max={15}
		valueStep={1}
	/>
{/if}

{#if !(displayEntity instanceof TextDisplay)}
	<Checkbox
		label={translate('dialog.display_entity.enchanted.title')}
		tooltip={translate('dialog.display_entity.enchanted.description')}
		bind:checked={enchanted}
		defaultValue={DisplayEntityConfig.prototype.enchanted}
	/>

	<Checkbox
		label={translate('dialog.display_entity.glowing.title')}
		tooltip={translate('dialog.display_entity.glowing.description')}
		bind:checked={glowing}
		defaultValue={DisplayEntityConfig.prototype.glowing}
	/>

	<Checkbox
		label={translate('dialog.display_entity.override_glow_color.title')}
		tooltip={translate('dialog.display_entity.override_glow_color.description')}
		bind:checked={overrideGlowColor}
		defaultValue={DisplayEntityConfig.prototype.overrideGlowColor}
	/>

	{#if $overrideGlowColor}
		<ColorPicker
			label={translate('dialog.display_entity.glow_color.title')}
			tooltip={translate('dialog.display_entity.glow_color.description')}
			bind:value={glowColor}
		/>
	{/if}
{/if}

<NumberSlider
	label={translate('dialog.display_entity.shadow_radius.title')}
	tooltip={translate('dialog.display_entity.shadow_radius.description')}
	bind:value={shadowRadius}
	defaultValue={DisplayEntityConfig.prototype.shadowRadius}
	min={0}
	max={15}
/>

<NumberSlider
	label={translate('dialog.display_entity.shadow_strength.title')}
	tooltip={translate('dialog.display_entity.shadow_strength.description')}
	bind:value={shadowStrength}
	defaultValue={DisplayEntityConfig.prototype.shadowStrength}
	min={0}
	max={15}
/>

<style>
	.variant-select {
		margin: 0px 32px 8px 24px;
	}
	.variant-select :global(bb-select) {
		width: 100%;
	}
</style>

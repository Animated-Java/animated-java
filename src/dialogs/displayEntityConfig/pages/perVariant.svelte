<script lang="ts" module>
	import { onDestroy } from 'svelte'
	import { DisplayEntityConfig } from '../../../nodeConfigs'
	import { TextDisplay } from '../../../outliner/textDisplay'
	import BoxSelect from '../../../svelteComponents/sidebarDialogItems/boxSelect.svelte'
	import Checkbox from '../../../svelteComponents/sidebarDialogItems/checkbox.svelte'
	import CodeEdit from '../../../svelteComponents/sidebarDialogItems/codeEdit.svelte'
	import NumberSlider from '../../../svelteComponents/sidebarDialogItems/numberSlider.svelte'
	import Select from '../../../svelteComponents/sidebarDialogItems/select.svelte'
	import { localize } from '../../../util/lang'
	import { Variant } from '../../../variants'
	import type { DisplayEntity } from '../displayEntityConfig'
</script>

<script lang="ts">
	interface Props {
		displayEntity: DisplayEntity
	}
	let { displayEntity }: Props = $props()

	const VARIANT_OPTIONS = Object.fromEntries(
		Variant.all.map(variant => [variant.uuid, variant.displayName])
	)

	let selectedVariantUuid = $state(Variant.getDefault().uuid)
	let selectedConfig = $derived.by<DisplayEntityConfig>(() => {
		const variant = Variant.getByUUID(selectedVariantUuid)
		if (!variant) {
			console.error(`Variant with UUID ${selectedVariantUuid} not found`)
			return DisplayEntityConfig.getDefault()
		}
		if (variant.isDefault) {
			return DisplayEntityConfig.fromJSON(displayEntity.configs.default)
		} else {
			return DisplayEntityConfig.fromJSON(
				displayEntity.configs.variants[selectedVariantUuid] ?? {}
			)
		}
	})

	let onApplyFunction = $derived(selectedConfig.onApplyFunction)
	let billboard = $derived(selectedConfig.billboard)
	let overrideBrightness = $derived(selectedConfig.overrideBrightness)
	let skyBrightness = $derived(selectedConfig.skyBrightness)
	let blockBrightness = $derived(selectedConfig.blockBrightness)
	let enchanted = $derived(selectedConfig.enchanted)
	let glowing = $derived(selectedConfig.glowing)
	let overrideGlowColor = $derived(selectedConfig.overrideGlowColor)
	let glowColor = $derived(selectedConfig.glowColor)
	let invisible = $derived(selectedConfig.invisible)
	let shadowRadius = $derived(selectedConfig.shadowRadius)
	let shadowStrength = $derived(selectedConfig.shadowStrength)

	function saveConfig() {
		selectedConfig.onApplyFunction = onApplyFunction
		selectedConfig.billboard = billboard
		selectedConfig.overrideBrightness = overrideBrightness
		selectedConfig.skyBrightness = skyBrightness
		selectedConfig.blockBrightness = blockBrightness
		selectedConfig.enchanted = enchanted
		selectedConfig.glowing = glowing
		selectedConfig.overrideGlowColor = overrideGlowColor
		selectedConfig.glowColor = glowColor
		selectedConfig.invisible = invisible
		selectedConfig.shadowRadius = shadowRadius
		selectedConfig.shadowStrength = shadowStrength

		const variant = Variant.getByUUID(selectedVariantUuid)
		if (!variant) {
			console.error(`Variant with UUID ${selectedVariantUuid} not found`)
			return
		}
		if (variant.isDefault) {
			displayEntity.configs.default = selectedConfig.toJSON()
		} else {
			displayEntity.configs.variants[variant.uuid] = selectedConfig.toJSON()
		}
		Project!.saved = false
	}

	onDestroy(() => {
		saveConfig()
	})
</script>

<div class="dialog-page-container">
	<Select
		label={localize('dialog.display_entity.variant.title')}
		description={localize('dialog.display_entity.variant.description')}
		options={VARIANT_OPTIONS}
		bind:value={selectedVariantUuid}
		onchange={() => saveConfig()}
	></Select>

	<hr />

	<CodeEdit
		label={localize('dialog.display_entity.on_apply_function.title')}
		description={localize('dialog.display_entity.on_apply_function.description')}
		bind:value={onApplyFunction}
		syntax="mcfunction"
	/>

	<BoxSelect
		label={localize('dialog.display_entity.billboard.title')}
		description={localize('dialog.display_entity.billboard.description')}
		options={{
			fixed: {
				type: 'text',
				label: localize('dialog.display_entity.billboard.options.fixed.label'),
				description: localize('dialog.display_entity.billboard.options.fixed.description'),
			},
			vertical: {
				type: 'text',
				label: localize('dialog.display_entity.billboard.options.vertical.label'),
				description: localize(
					'dialog.display_entity.billboard.options.vertical.description'
				),
			},
			horizontal: {
				type: 'text',
				label: localize('dialog.display_entity.billboard.options.horizontal.label'),
				description: localize(
					'dialog.display_entity.billboard.options.horizontal.description'
				),
			},
			center: {
				type: 'text',
				label: localize('dialog.display_entity.billboard.options.center.label'),
				description: localize('dialog.display_entity.billboard.options.center.description'),
			},
		}}
		bind:selected={billboard}
	/>

	<Checkbox
		label={localize('dialog.display_entity.override_brightness.title')}
		description={localize('dialog.display_entity.override_brightness.description')}
		bind:value={overrideBrightness}
	/>

	{#if overrideBrightness}
		<NumberSlider
			label={localize('dialog.display_entity.sky_brightness.title')}
			description={localize('dialog.display_entity.sky_brightness.description')}
			bind:value={skyBrightness}
			min={0}
			max={15}
			step={1}
		/>

		<NumberSlider
			label={localize('dialog.display_entity.block_brightness.title')}
			description={localize('dialog.display_entity.block_brightness.description')}
			bind:value={blockBrightness}
			min={0}
			max={15}
			step={1}
		/>
	{/if}

	{#if !(displayEntity instanceof TextDisplay)}
		<Checkbox
			label={localize('dialog.display_entity.enchanted.title')}
			description={localize('dialog.display_entity.enchanted.description')}
			bind:value={enchanted}
		/>

		<Checkbox
			label={localize('dialog.display_entity.glowing.title')}
			description={localize('dialog.display_entity.glowing.description')}
			bind:value={glowing}
		/>

		<Checkbox
			label={localize('dialog.display_entity.override_glow_color.title')}
			description={localize('dialog.display_entity.override_glow_color.description')}
			bind:value={overrideGlowColor}
		/>

		<!-- {#if $overrideGlowColor}
		<ColorPicker
			label={localize('dialog.display_entity.glow_color.title')}
			description={localize('dialog.display_entity.glow_color.description')}
			bind:value={glowColor}
		/>
	{/if} -->
	{/if}

	<NumberSlider
		label={localize('dialog.display_entity.shadow_radius.title')}
		description={localize('dialog.display_entity.shadow_radius.description')}
		bind:value={shadowRadius}
		min={0}
		max={15}
	/>

	<NumberSlider
		label={localize('dialog.display_entity.shadow_strength.title')}
		description={localize('dialog.display_entity.shadow_strength.description')}
		bind:value={shadowStrength}
		min={0}
		max={15}
	/>
</div>

<style>
	.dialog-page-container {
		overflow-y: auto;
		max-height: 75vh;
		padding-right: 16px;
		padding-left: 2px;
	}
	hr {
		border-top: 2px solid var(--color-border);
		margin: 32px;
	}
</style>

<script lang="ts">
	import { fly, slide } from '../../util/accessability'
	import { translate } from '../../../util/translation'
	import type { Variant } from '../../../variants'
	import FlatIconButton from '../buttons/flatIconButton.svelte'
	import IconButton from '../buttons/iconButton.svelte'
	import TextureMapping from './textureMapping.svelte'

	let descriptionVisible = false
	let helpButtonHovered = false
	let descriptionState: 'introstart' | 'introend' | 'outrostart' | 'outroend' | 'none' = 'none'
	const translations = {
		name: translate('animated_java.dialog.variant_properties.textureMap'),
		description: translate(
			'animated_java.dialog.variant_properties.textureMap.description'
		).split('\n'),
	}

	export let variant: Variant
	const projectTextures = Texture.all
	let updateVariants: number = 0

	function onHelpButtonHovered(hovered: boolean) {
		helpButtonHovered = hovered
		if (descriptionState === 'outrostart') return
		descriptionVisible = hovered
	}

	function onDescriptionTransition(state: typeof descriptionState) {
		// console.log(`Description transition ${state}`)
		descriptionState = state
		descriptionVisible = helpButtonHovered
	}

	function onHelpButtonClick() {
		AnimatedJava.docClick('page:rig/variants#texture_map')
	}

	function onResetMappingClick(from: string) {
		// console.log('delete mapping')
		variant.removeTextureMapping(from)
		updateVariants++
	}
</script>

<div class="setting flex-column" style="align-items:stretch;">
	<div class="setting-container" style="justify-content:space-between;">
		<div class="flex">
			<p class="setting-name">
				{translations.name}
			</p>
		</div>

		<IconButton
			onClick={onHelpButtonClick}
			onHoverChange={onHelpButtonHovered}
			icon="question_mark"
		/>
	</div>

	<div class="setting-value">
		{#key updateVariants}
			{#each projectTextures as from}
				<div class="texture-mapping">
					<TextureMapping {variant} fromTexture={from} />
					<FlatIconButton
						onClick={() => onResetMappingClick(from.uuid)}
						icon="undo"
						iconStyle="margin-right: 0.25em;"
					/>
				</div>
			{/each}
		{/key}
	</div>

	<div class="spacer" />

	{#if helpButtonHovered}
		<div
			class="setting-description flex-column"
			in:$slide={{ delay: 500, duration: 250 }}
			out:$slide={{ duration: 250 }}
		>
			{#each translations.description as line, index}
				<p
					class="setting-description"
					in:$fly={{ x: -20, delay: 700 + 100 * index, duration: 500 }}
				>
					{line}
				</p>
			{/each}
		</div>
	{/if}
</div>

<style>
	div.texture-mapping {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-grow: 1;
		background-color: var(--color-dark);
		min-height: 34px;
	}

	p {
		display: inline-block;
	}

	p.setting-name {
		width: 150px;
	}

	div.spacer {
		min-height: 10px;
	}

	div.setting-description {
		pointer-events: none;
		background: var(--color-dark);
		padding-left: 5px;
		padding-right: 5px;
		padding-bottom: 5px;
		margin-bottom: 10px;
		overflow: hidden;
	}

	p.setting-description {
		margin: 5px;
		margin-bottom: 0px;
	}

	div.setting {
		display: flex;
		align-items: center;
		padding: 10px;
		padding-bottom: 0px;
		position: relative;
		justify-content: space-between;
		border-bottom: 1px solid var(--color-border);
		background-color: var(--color-back);
		border-bottom: 4px solid var(--color-border);
		margin-bottom: 10px;
	}

	div.flex-column {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	div.setting-container {
		display: flex;
		flex-direction: row;
	}

	div.setting-value {
		display: grid;
		margin-top: 10px;
		grid-gap: 10px;
	}
</style>

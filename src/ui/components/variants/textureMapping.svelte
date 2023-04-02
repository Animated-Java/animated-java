<script lang="ts">
	import type { Variant } from '../../../variants'
	import TextureMappingValue from './textureMappingValue.svelte'
	export let fromTexture: Texture
	export let variant: Variant

	const options = [...Texture.all]

	let from: number = options.indexOf(fromTexture)
	let to: number = options.indexOf(fromTexture)

	$: to !== -1 && onUpdateMapping()

	function onUpdateMapping() {
		if (!Project?.animated_java_variants) return
		const texture = options[to]
		variant.addTextureMapping(fromTexture.uuid, texture.uuid)
	}

	function loadMapping() {
		const texId = variant.textureMap[fromTexture.uuid]
		if (!texId) return
		to = options.findIndex(t => t.uuid === texId)
	}

	loadMapping()
</script>

<div class="texture-mapping-value">
	<TextureMappingValue value={from} {options} locked />
	<span class="material-icons">arrow_right_alt</span>
	<TextureMappingValue bind:value={to} {options} />
</div>

<style>
	div.texture-mapping-value {
		display: flex;
		align-items: center;
		flex-grow: 1;
	}
</style>

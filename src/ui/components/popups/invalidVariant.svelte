<script lang="ts">
	import { translate } from '../../../util/translation'
	import type { ITextureMapping, Variant } from '../../../variants'
	import Prism from '../prism/prismCodebox.svelte'

	export let variant: Variant
	export let removedTextureMappings: ITextureMapping[]

	const translations = {
		variant_name: translate('animated_java.popup.invalid_texture_mapping.body', {
			variant: variant.name,
		}),
		reason: translate('animated_java.popup.invalid_texture_mapping.reason'),
		invalid_from_texture: translate(
			'animated_java.popup.invalid_texture_mapping.reason.invalid_from_texture'
		),
		invalid_to_texture: translate(
			'animated_java.popup.invalid_texture_mapping.reason.invalid_to_texture'
		),
		footer: translate('animated_java.popup.invalid_texture_mapping.footer'),
	}

	const cleanedMappings = removedTextureMappings.map(m => {
		const { from, fromTexture, to, toTexture } = m
		return {
			from,
			fromTexture:
				(fromTexture && {
					name: fromTexture.name,
					uuid: fromTexture.uuid,
				}) ||
				undefined,
			to,
			toTexture:
				(toTexture && {
					name: toTexture.name,
					uuid: toTexture.uuid,
				}) ||
				undefined,
		}
	})
</script>

<div class="container">
	<p>
		{translations.variant_name}
	</p>
	{#each cleanedMappings as mapping}
		<div class="invalid-mapping">
			<div class="prism-container">
				<Prism language="json" code={JSON.stringify(mapping, null, '\t')} />
			</div>
			<div class="reason">
				<h5>{translations.reason}</h5>
				<ul>
					{#if !mapping.fromTexture}
						<li>{translations.invalid_from_texture}</li>
					{/if}
					{#if !mapping.toTexture}
						<li>{translations.invalid_to_texture}</li>
					{/if}
				</ul>
			</div>
		</div>
	{/each}
	<p>{translations.footer}</p>
</div>

<style>
	div.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow-y: auto;
		max-height: 50em;
	}

	div.prism-container {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: center;
		flex-grow: 1;

		background-color: var(--color-back);
		border: 2px solid var(--color-border);
		padding: 0.75em 1em;
		padding-top: 0.7em;
		border-radius: 0.25em;

		max-height: 20em;
	}

	div.invalid-mapping {
		display: flex;
		flex-direction: column;
		align-items: stretch;

		padding: 1em;
		background-color: var(--color-button);
		/* border: 2px solid var(--color-border); */
		border-radius: 0.25em;
		width: -webkit-fill-available;
		margin: 0.25em;
	}

	div.reason {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
	}

	h5 {
		margin: 0.2em 0.5em;
	}

	ul {
		margin-left: 2em;
	}

	li {
		list-style: unset;
	}
</style>

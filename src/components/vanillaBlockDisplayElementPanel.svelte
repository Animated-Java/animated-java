<script lang="ts" context="module">
	import { validateBlock } from 'src/util/minecraftUtil'
	import { VanillaBlockDisplay } from '../outliner/vanillaBlockDisplay'
	import { translate } from '../util/translation'
</script>

<script lang="ts">
	export let selected: VanillaBlockDisplay

	let block = selected.block
	let error = selected.error

	$: {
		$error = ''
		if (selected.block !== block) {
			void validateBlock(block)
				.then(err => {
					if (err) {
						$error = err
						console.log('Block validation error:', err)
						return
					}
					console.log('Changing block to', block)
					Undo.initEdit({ elements: [selected] })

					selected.block = block
					Project!.saved = false

					Undo.finishEdit(`Change Block Display Block to "${block}"`, {
						elements: [selected],
					})
				})
				.catch(err => {
					$error = err.message
				})
		}
	}
</script>

<p class="panel_toolbar_label label">
	{translate('panel.vanilla_block_display.title')}
</p>

<div class="toolbar custom-toolbar" title={translate('panel.vanilla_block_display.description')}>
	<div class="content" style="width: 95%;">
		<input type="text" bind:value={block} />
	</div>
</div>

{#if $error}
	<div class="error">
		{$error}
	</div>
{/if}

<style>
	input {
		background-color: var(--color-button);
		padding: 2px 8px;
		width: 100%;
	}
	.label {
		margin-bottom: -3px !important;
	}
	.custom-toolbar {
		display: flex;
		flex-direction: row;
		margin-bottom: 1px;
	}
	.custom-toolbar :global(.sp-replacer) {
		padding: 4px 18px !important;
		height: 28px !important;
		margin: 1px 0px !important;
	}
	.error {
		margin: 2px 8px;
		font-size: 14px;
		color: var(--color-error);
	}
</style>

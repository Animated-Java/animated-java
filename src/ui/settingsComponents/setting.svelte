<script lang="ts">
	import { onDestroy } from 'svelte'
	import { fade, fly } from 'svelte/transition'
	import { bounceOut } from 'svelte/easing'
	import * as Settings from '../../settings'
	import { defer, objectEqual } from '../../util'
	import HelpButton from './helpButton.svelte'
	import Overlay from './overlay.svelte'

	export let setting: Settings.AJSetting<any>
	let loaded = false

	defer(() => {
		loaded = true
	})

	setting._onInit()

	$: {
		setting._onUpdate()
	}
</script>

{#if loaded}
	<div class="setting flex_column" style="align-items:stretch;">
		<div class="flex_row" style="justify-content:space-between;">
			<div class="flex">
				<p>{setting.displayName}</p>
			</div>
			<div class="flex" style="justify-content:flex-end; flex-grow:1; padding-left:10px;">
				{#if setting instanceof Settings.AJCheckboxSetting}
					<input type="checkbox" bind:checked={setting.value} />
				{/if}

				{#if setting instanceof Settings.AJNumberSetting}
					<input
						type="number"
						class="number"
						step={setting.step}
						bind:value={setting.value}
					/>
				{/if}

				{#if setting instanceof Settings.AJInlineTextSetting}
					<input type="text" class="text_inline" bind:value={setting.value} />
				{/if}

				{#if setting instanceof Settings.AJDropdownSetting}
					<select value={setting.value}>
						{#each setting.options as option}
							<option value={setting.options.indexOf(option)}>
								<p>{option.displayName}</p>
							</option>
						{/each}
					</select>
				{/if}

				{#if setting instanceof Settings.AJFolderSetting}
					<input
						type="text"
						class="text_inline"
						contenteditable="false"
						bind:value={setting.value}
					/>
				{/if}

				<HelpButton {setting} />
			</div>
		</div>

		{#if setting.errors}
			<div class="flex_column error" style="margin-top: 10px; overflow:hidden;">
				{#each setting.errors as error, index}
					{#key error}
						<div
							class="flex_row"
							in:fly={{
								y: -10,
								duration: 500,
								delay: 150 * index,
								easing: bounceOut,
							}}
							out:fade={{ duration: 0 }}
						>
							<div class="flex_column">
								<div class="flex_row">
									<div class="material-icons error" style="margin-right:10px">
										error
									</div>
									<p>{error.title}</p>
								</div>
								{#each error.lines as line}
									<p>{line}</p>
									<br />
								{/each}
							</div>
						</div>
					{/key}
				{/each}
			</div>
		{/if}

		<!-- {#if setting.warnings}
			<div class="flex_column warning" style="margin-top: 10px; overflow:hidden;">
				{#each setting.warnings as warning, index}
					{#key warning}
						<div
							class="flex_row"
							in:fly={{
								y: -10,
								duration: 500,
								delay: 150 * index,
								easing: bounceOut,
							}}
							out:fade={{ duration: 0 }}
						>
							<div class="material-icons warning" style="margin-right:10px">
								warning
							</div>
							{#each warning.lines as line}
								<p>{line}</p>
								<br />
							{/each}
						</div>
					{/key}
				{/each}
			</div>
		{/if} -->
	</div>
{/if}

<style>
	/* .warning {
		color: var(--color-warning);
	} */

	.error {
		color: var(--color-error);
	}

	p {
		display: inline-block;
	}

	div.setting {
		display: flex;
		align-items: center;
		padding: 10px;
		position: relative;
		justify-content: space-between;
		border-bottom: 1px solid var(--color-border);
		background-color: var(--color-back);
		border-bottom: 4px solid var(--color-border);
		margin-bottom: 10px;
	}

	.text_inline {
		background: var(--color-dark);
		font-family: var(--font-code);
		/* flex-grow: 1; */
		padding: 5px;
		padding-left: 11px;
		padding-right: 11px;
		width: 350px;
	}

	div.flex {
		display: flex;
		align-items: center;
	}

	div.flex_column {
		display: flex;
		align-items: center;
		flex-direction: column;
		align-items: flex-start;
	}

	div.flex_row {
		display: flex;
		align-items: center;
		flex-direction: row;
	}

	.number {
		border: none;
		background: var(--color-button);
		display: inline-block;
		text-align: center;
		vertical-align: middle;
		cursor: default;
		outline: none;
		height: 32px;
		min-width: 100px;
		width: auto;
		color: var(--color-text);
		padding-right: 16px;
		padding-left: 16px;
		font-weight: normal;
		cursor: pointer;
	}
</style>

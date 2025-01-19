<script lang="ts">
	import { CodeJar } from '@novacbn/svelte-codejar'
	import { Valuable } from '../../../util/stores'
	import BaseSidebarDialogItem from './baseSidebarDialogItem.svelte'
	export let label: string
	export let description: string
	export let value: Valuable<string>
	export let required: boolean = false
	export let defaultValue: string = ''
	// export let placeholder: string = ''
	export let valueChecker: DialogItemValueChecker<string> = undefined

	let warning = ''
	let error = ''
	let alertBorder = ''

	let codeJar: CodeJar

	function forceNoWrap() {
		if (!codeJar) return
		codeJar.$$.ctx[0].style.overflowWrap = 'unset'
		codeJar.$$.ctx[0].style.whiteSpace = 'nowrap'
	}

	$: {
		if (error) {
			alertBorder = 'error-outline'
		} else if (warning) {
			alertBorder = 'warning-outline'
		} else {
			alertBorder = ''
		}
	}

	function highlight(code: string): string {
		return Prism.highlight(code, Prism.languages['mc-build'], 'mc-build')
	}

	$: {
		if (valueChecker) {
			const result = valueChecker($value)
			result.type === 'warning' ? (warning = result.message) : (warning = '')
			result.type === 'error' ? (error = result.message) : (error = '')
		}
	}
</script>

<BaseSidebarDialogItem {label} {required} {description} {warning} {error}>
	<div class="input-container {alertBorder}">
		<CodeJar
			on:change={() => forceNoWrap()}
			syntax="mc-build"
			{highlight}
			bind:this={codeJar}
			bind:value={$value}
			onUpdate={value => {
				console.log('Updated value:', value)
			}}
			preserveIdent
			withLineNumbers
			catchTab
			addClosing
			tab={'\t'}
		/>
	</div>
	{#if defaultValue !== '' && $value !== defaultValue}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<i
			class="fa fa-arrow-rotate-left text_icon reset-button"
			on:click={() => ($value = defaultValue)}
		/>
	{/if}
</BaseSidebarDialogItem>

<style>
	.input-container {
		display: flex;
		flex-direction: row;
		width: 100%;
		position: relative;
		transition: outline 0.1s cubic-bezier(0.25, 0.68, 0.53, 1.3);
		z-index: 1;
	}
	.input-container :global(.codejar-wrap) {
		width: 100%;
	}
	.input-container :global(pre) {
		background-color: var(--color-back);
		font-family: var(--font-code);
		font-size: 14px;
		text-align: left;
		padding: 4px 8px !important;
		padding-left: 48px !important;
		height: 17px;
		resize: vertical;
		border: 1px solid var(--color-dark);
		border-radius: 0;
		margin-bottom: 0px;
		outline: none;
		overflow-wrap: unset;
		overflow-y: auto;
		white-space: nowrap;
		margin-top: 0px;
		margin-left: 2px;
		min-height: 8em;
		/* width: 100%; */
	}
	.input-container :global(.codejar-linenumbers) {
		width: 40px !important;
		background-color: var(--color-button) !important;
		mix-blend-mode: unset !important;
		color: var(--color-subtle_text) !important;
		padding-left: 8px !important;
	}
	i {
		align-content: center;
		text-align: center;
		width: 32px;
	}
	.reset-button {
		cursor: pointer;
		position: absolute;
		right: 0;
		top: 0;
		height: 100%;
	}
	.reset-button:hover {
		color: var(--color-light);
	}
	.error-outline {
		outline: 2px solid var(--color-error);
	}
	.warning-outline {
		outline: 2px solid var(--color-warning);
	}
</style>

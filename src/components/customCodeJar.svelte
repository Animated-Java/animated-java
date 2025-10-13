<script lang="ts">
	import { CodeJar } from '@novacbn/svelte-codejar'

	export let value: string
	export let placeholder: string | undefined = undefined
	export let syntax: string | undefined = undefined

	let codeJarElement: HTMLPreElement | undefined

	function highlight(code: string, syntax?: string) {
		if (!syntax) return code
		return Prism.highlight(code, Prism.languages[syntax], syntax)
	}

	const onKeydown = (e: Event) => {
		if (!(e instanceof KeyboardEvent)) return
		if (e.key === 'Tab' || e.key === 'Enter') {
			e.stopPropagation()
		} else if ((e.code === 'KeyZ' || e.code === 'KeyY') && e.ctrlKey) {
			// CodeJar doesn't capture undo correctly. So we have to fudge it a little.
			requestAnimationFrame(() => {
				if (codeJarElement?.textContent != undefined) {
					value = codeJarElement.textContent
				}
			})
		}
	}

	const forceNoWrap = () => {
		if (!codeJarElement) return
		codeJarElement.style.overflowWrap = 'unset'
		codeJarElement.style.whiteSpace = 'pre'
	}

	$: value !== undefined && forceNoWrap()
</script>

<div class="content codejar-container" on:keydown={onKeydown}>
	<CodeJar
		bind:element={codeJarElement}
		{syntax}
		{highlight}
		bind:value
		on:change={() => forceNoWrap()}
		preserveIdent
		history
		class={'language-' + (syntax ?? 'plaintext')}
		style="
			font-family: var(--font-code);
			font-size: 14px;
			padding: 3px 6px;
			max-height: 20em;
			height: fit-content;
			padding-bottom: 1rem;
			width: 100%;
			outline: none;
			overflow-wrap: unset;
			overflow-y: scroll;
			white-space: pre;
			margin: 0;
			border: 1px solid var(--color-border);
			border-radius: 0;
			text-shadow: 0px 1px rgba(0, 0, 0, 0.3);
		"
	/>
	{#if placeholder && (!value || value.length === 0)}
		<div class="placeholder">{placeholder}</div>
	{/if}
</div>

<style>
	.content {
		position: relative;
	}
	.placeholder {
		position: absolute;
		pointer-events: none;
		color: var(--color-subtle_text);
		font-family: var(--font-code);
		font-size: 14px;
		padding: 6px 12px;
		user-select: none;
		opacity: 0.5;
		top: 0;
		left: 0;
		width: 100%;
		font-style: italic;
	}
	.codejar-container :global(.language-snbtTextComponent) {
		& .brackets {
			color: #5ba8c5;
		}
		& .token.punctuation {
			color: #89ddff;
		}
		& .token.property {
			color: #eeffff;
		}
		& .token.escape-sequence {
			color: #89ddff;
		}
		& .token.constant {
			color: #c767d7;
			border-bottom: 1px solid;
		}
		& .token.number {
			color: #f92672;
		}
		& .token.boolean {
			color: #f78c6c;
		}
		& .token.string {
			color: #aef941;
		}
	}
</style>

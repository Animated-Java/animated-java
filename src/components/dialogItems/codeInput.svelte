<script lang="ts">
	import { onDestroy } from 'svelte'
	import { Valuable } from '../../util/stores'
	import CustomCodeJar from '../customCodeJar.svelte'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip = ''
	export let value: Valuable<string>
	export let defaultValue: string
	export let valueChecker: DialogItemValueChecker<string> = undefined
	export let syntax: string | undefined = undefined

	value.get()

	let codeJarElement: HTMLPreElement | undefined

	let warningText = ''
	let errorText = ''

	function onValueChange() {
		if (valueChecker) {
			const result = valueChecker($value)
			result.type === 'error' ? (errorText = result.message) : (errorText = '')
			result.type === 'warning' ? (warningText = result.message) : (warningText = '')
		}
	}

	const unsub = value.subscribe(() => {
		onValueChange()
	})
	onDestroy(() => {
		unsub()
	})

	const onKeydown = (e: Event) => {
		if (!(e instanceof KeyboardEvent)) return
		if (e.key === 'Tab' || e.key === 'Enter') {
			e.stopPropagation()
		} else if ((e.code === 'KeyZ' || e.code === 'KeyY') && e.ctrlKey) {
			// CodeJar doesn't capture undo correctly. So we have to fudge it a little.
			requestAnimationFrame(() => {
				if (codeJarElement?.textContent != undefined) {
					$value = codeJarElement.textContent
				}
			})
		}
	}

	function onReset() {
		$value = defaultValue
		onValueChange()
	}

	onValueChange()
</script>

<BaseDialogItem {label} {tooltip} {onReset} let:id>
	<div class="dialog_bar form_bar custom">
		<label class="name_space_left" for={id}>{label}</label>

		<div class="content codejar-container" on:keydown={onKeydown}>
			<CustomCodeJar
				{syntax}
				bind:value={$value}
				style={errorText
					? 'border: 1px solid var(--color-error); border-bottom: none; border-radius: 0.3em 0.3em 0 0;'
					: 'border: 1px solid var(--color-border);'}
			/>
			{#if errorText || warningText}
				<textarea readonly rows={errorText.split('\n').length + 1}
					>{errorText ?? warningText}</textarea
				>
			{/if}
		</div>
	</div>
</BaseDialogItem>

<style>
	label {
		margin-bottom: 8px;
	}
	.custom {
		flex-direction: column;
	}
	textarea {
		color: var(--color-error);
		background-color: var(--color-back);
		padding: 3px 6px;
		overflow: auto;
		height: min-content;
		font-size: 0.9rem;
		font-family: var(--font-code);
		margin: 8px;
		margin-top: 0px;
		border-radius: 0 0 0.3em 0.3em;
		border: 1px solid var(--color-error);
		white-space: pre;
		tab-size: 4;
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

<script lang="ts">
	import { type Observable } from 'svelte-observable-store'
	import CustomCodeJar from '../../svelteComponents/customCodeJar.svelte'
	import BaseDialogItem from './baseDialogItem.svelte'

	interface Props {
		label: string
		tooltip?: string
		value: Observable<string>
		defaultValue: string
		valueChecker?: DialogItemValueChecker<string>
		syntax?: string | undefined
	}

	let {
		label,
		tooltip = '',
		value = $bindable(),
		defaultValue,
		valueChecker = undefined,
		syntax = undefined,
	}: Props = $props()

	$effect.pre(() => {
		value.get()

		const unsub = value.subscribe(() => {
			void onValueChange()
		})

		return () => {
			unsub()
		}
	})

	let warningText = $state('')
	let errorText = $state('')

	async function onValueChange() {
		if (valueChecker) {
			const result = await valueChecker($value)
			result.type === 'error' ? (errorText = result.message) : (errorText = '')
			result.type === 'warning' ? (warningText = result.message) : (warningText = '')
		}
	}

	function onReset() {
		$value = defaultValue
		void onValueChange()
	}

	void onValueChange()
</script>

<BaseDialogItem {label} {tooltip} {onReset}>
	{#snippet children({ id })}
		<div class="dialog_bar form_bar custom">
			<label class="name_space_left" for={id}>{label}</label>

			<div class="content codejar-container">
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
	{/snippet}
</BaseDialogItem>

<style>
	label {
		margin-bottom: 8px;
	}
	.custom {
		flex-direction: column;
		align-items: flex-start;
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
	.codejar-container {
		width: 100%;
	}
	:global(.language-snbtTextComponent) {
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

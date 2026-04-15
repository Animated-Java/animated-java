<script lang="ts">
	import { type Observable } from 'svelte-observable-store'
	import BaseDialogItem from './baseDialogItem.svelte'

	interface Props {
		label: string
		tooltip?: string
		options: Record<string, string>
		defaultOption: string
		value: Observable<string>
	}

	let { label, tooltip = '', options, defaultOption, value = $bindable() }: Props = $props()

	let selectElement: Interface.CustomElements.SelectInput<Record<string, string>> | undefined

	$effect.pre(() => {
		if (!(value.get() || options[value.get()])) value.set(defaultOption)

		const unsub = value.subscribe(v => {
			selectElement?.set(v)
		})

		return () => {
			unsub()
			selectElement?.node.remove()
		}
	})

	function onReset() {
		value.set(defaultOption)
		if (selectElement?.node) {
			selectElement.set(defaultOption)
		}
	}

	const mountSelect = (node: HTMLDivElement) => {
		selectElement = new Interface.CustomElements.SelectInput('dialog-select', {
			options,
			value: value.get(),
			onChange() {
				const v = selectElement?.node.getAttribute('value')
				if (v == undefined) {
					console.warn('Select value is undefined')
					return
				}
				value.set(v)
			},
		})

		node.appendChild(selectElement.node)
	}
</script>

<BaseDialogItem {label} {tooltip} {onReset}>
	{#snippet children({ id })}
		<div class="dialog_bar form_bar" use:mountSelect>
			<label class="name_space_left" for={id}>{label}</label>
		</div>
	{/snippet}
</BaseDialogItem>

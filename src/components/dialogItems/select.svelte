<script lang="ts">
	import { onDestroy } from 'svelte'
	import { Valuable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip = ''
	export let options: Record<string, string>
	export let defaultOption: string
	export let value: Valuable<string>

	if (!(value.get() || options[value.get()])) value.set(defaultOption)

	const SELECT_ELEMENT = new Interface.CustomElements.SelectInput('dialog-select', {
		options,
		value: value.get(),
		onChange() {
			const v = SELECT_ELEMENT.node.getAttribute('value')
			if (v == undefined) {
				console.warn('Select value is undefined')
				return
			}
			value.set(v)
		},
	})

	function onReset() {
		value.set(defaultOption)
		if (SELECT_ELEMENT.node) {
			SELECT_ELEMENT.set(defaultOption)
		}
	}

	const unsub = value.subscribe(v => {
		SELECT_ELEMENT.set(v)
	})

	onDestroy(() => {
		unsub()
		SELECT_ELEMENT.node.remove()
	})

	const mountSelect = (node: HTMLDivElement) => {
		node.appendChild(SELECT_ELEMENT.node)
	}
</script>

<BaseDialogItem {label} {tooltip} {onReset} let:id>
	<div class="dialog_bar form_bar" use:mountSelect>
		<label class="name_space_left" for={id}>{label}</label>
	</div>
</BaseDialogItem>

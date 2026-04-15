<script lang="ts">
	import { type Observable } from 'svelte-observable-store'
	import BaseDialogItem from './baseDialogItem.svelte'

	interface Props {
		label: string
		tooltip?: string
		value: Observable<string>
		defaultValue: string
		fileType?: Parameters<typeof Filesystem.importFile>[0]['type']
		extensions?: string[]
		multiple?: boolean
		readtype?: Parameters<typeof Filesystem.importFile>[0]['readtype']
		fileSelectMessage?: string
		valueChecker?: DialogItemValueChecker<string>
	}

	let {
		label,
		tooltip = '',
		value = $bindable(),
		defaultValue,
		fileType = 'all',
		extensions = [],
		multiple = false,
		readtype,
		fileSelectMessage = 'Select File',
		valueChecker = undefined,
	}: Props = $props()

	let warningText = $state('')
	let errorText = $state('')

	function checkValue() {
		if (!valueChecker) return
		const result = valueChecker(value.get())
		result.type === 'error' ? (errorText = result.message) : (errorText = '')
		result.type === 'warning' ? (warningText = result.message) : (warningText = '')
	}

	const onValueChange = () => {
		checkValue()
	}

	$effect.pre(() => {
		value.subscribe(onValueChange)
	})

	function selectFile() {
		Filesystem.importFile({
			title: fileSelectMessage,
			startpath: value.get() ?? undefined,
			type: fileType,
			extensions,
			multiple,
			readtype,
		})
	}

	function onReset() {
		$value = defaultValue
	}
</script>

<BaseDialogItem {label} {tooltip} {onReset} bind:warningText bind:errorText>
	{#snippet children({ id })}
		<div class="dialog_bar form_bar">
			<label class="name_space_left" for={id}>{label}</label>
			<input
				type="text"
				class="dark_bordered half focusable_input"
				{id}
				bind:value={$value}
			/>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div class="tool animated-java-file-select-icon" onclick={() => selectFile()}>
				<i class="material-icons icon">insert_drive_file</i>
			</div>
		</div>
	{/snippet}
</BaseDialogItem>

<style>
	.animated-java-file-select-icon {
		display: flex;
		justify-content: flex-end;
	}
	i {
		font-size: 20px;
		margin-right: 4px;
		color: var(--color-subtle_text);
		cursor: pointer;
	}
	i:hover {
		color: var(--color-text);
	}
	input {
		font-family: var(--font-code);
	}
</style>

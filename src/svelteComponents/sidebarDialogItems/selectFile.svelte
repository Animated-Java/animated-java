<script lang="ts" module>
	import BaseSidebarDialogItem from './baseSidebarDialogItem.svelte'
	import type { ValueCheckResult } from './sidebarDialogTypes'
</script>

<script lang="ts">
	interface Props {
		label: string
		description?: string
		value: string
		extensions?: string[]
		readtype?: Parameters<typeof Filesystem.importFile>[0]['readtype']
		required?: boolean
		checkValue?: (value: string) => Promise<ValueCheckResult> | ValueCheckResult
	}

	let {
		label,
		description,
		value = $bindable(),
		extensions,
		readtype,
		required,
		checkValue,
	}: Props = $props()

	let error = $state<string | undefined>()
	let warning = $state<string | undefined>()

	function selectFile(id: string) {
		Filesystem.importFile(
			{
				title: 'Select File',
				startpath: value,
				type: 'json',
				extensions: extensions ?? [],
				readtype,
				resource_id: 'animated_java:select_file.' + id,
			},
			files => {
				if (files.length === 0) return
				value = files[0].path
			}
		)
	}

	$effect(() => {
		if (!checkValue) return

		const result = checkValue(value)

		if (result instanceof Promise) {
			void result.then(resolvedResult => {
				if (!resolvedResult) {
					error = undefined
					warning = undefined
				} else if (resolvedResult.type === 'error') {
					error = resolvedResult.message
					warning = undefined
				} else if (resolvedResult.type === 'warning') {
					error = undefined
					warning = resolvedResult.message
				}
			})
			return
		}

		if (!result) {
			error = undefined
			warning = undefined
		} else if (result.type === 'error') {
			error = result.message
			warning = undefined
		} else if (result.type === 'warning') {
			error = undefined
			warning = result.message
		}
	})
</script>

<BaseSidebarDialogItem {label} {description} {required} {error} {warning}>
	{#snippet children(id)}
		<input
			type="text"
			{id}
			class="{error ? 'error' : ''} {warning ? 'warning' : ''}"
			bind:value
		/>
		<i class="fa fa-file" onclick={() => selectFile(id)}></i>
	{/snippet}
</BaseSidebarDialogItem>

<style>
	input {
		width: 100%;
		background-color: var(--color-back);
		outline: 1px solid var(--color-border);
		padding-left: 4px;
		padding-right: 24px;

		border-radius: 0;
		transition: outline 0.1s cubic-bezier(0.25, 0.68, 0.53, 1.3);
	}

	i {
		position: absolute;
		top: 4px;
		right: 4px;
		cursor: pointer;
	}

	i:hover {
		color: var(--color-light);
	}

	.error {
		outline: 2px solid var(--color-error);
	}

	.warning {
		outline: 2px solid var(--color-warning);
	}
</style>

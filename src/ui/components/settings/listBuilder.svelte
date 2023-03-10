<script lang="ts">
	import SettingContainer from '../settingContainer.svelte'
	import type * as AJ from '../../../settings'
	import FlatIconButton from '../buttons/flatIconButton.svelte'
	import { slide } from 'svelte/transition'

	export let setting: AJ.ListBuilderSetting
	let selected = -1
	let update = 0
	let items = setting.value

	function addItem(item: AJ.IListItem) {
		setting.addItem(item)
		console.log('Adding', setting.value)
		items = setting.value
		update++
	}

	function removeItem(item: AJ.IListItem) {
		setting.removeItem(item)
		console.log('Removing', setting.value)
		items = setting.value
		update++
	}

	function onChange() {
		if (selected === -1) return
		addItem(setting.options[selected])
		selected = -1
	}
</script>

<SettingContainer {setting}>
	<select slot="inline" bind:value={selected} on:change={onChange}>
		<option value={-1}>
			<div>Add a bone</div>
		</option>
		{#each setting.options as option, index}
			<option value={index}>
				<div>{option.name}</div>
			</option>
		{/each}
	</select>

	<div slot="beneath">
		{#if items.length !== 0}
			<div class="slot-container">
				{#each items as item (item.value)}
					<div class="item" transition:slide={{ duration: 250 }}>
						{item.name}
						<FlatIconButton icon="delete" onClick={() => removeItem(item)} />
					</div>
				{/each}
			</div>
		{/if}
	</div>
</SettingContainer>

<style>
	select {
		height: 34px;
	}
	div.slot-container {
		display: flex;
		flex-direction: column;
		margin-top: 10px;
	}
	div.item {
		display: flex;
		justify-content: space-between;
		background-color: var(--color-dark);
		padding: 4px 2px 4px 10px;
		margin-bottom: 10px;
	}
	div.item:last-child {
		margin-bottom: 0;
	}
</style>

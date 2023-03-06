<script lang="ts">
	import { slide } from 'svelte/transition'
	import type { AnyGUIElement } from '../..//GUIStructure'
	import * as AJ from '../../settings'
	import Setting from './setting.svelte'

	export let el: AnyGUIElement
	export let settingArray: AJ.Setting<any>[]
	let setting: AJ.Setting<any>

	if (el.type === 'setting') {
		setting = Object.values(settingArray).find(s => s.id === (el as any).id)!
		if (!setting) throw new Error(`Setting ${el.id} not found`)
	}

	let enabled = el.type === 'toggle' ? false : true
	function toggle() {
		enabled = !enabled
	}
</script>

{#if el.type === 'setting'}
	<Setting {setting} />
{:else if el.type === 'group'}
	<div>
		<div class="group-title" on:click={toggle} on:keydown={() => {}}>
			<span class="material-icons custom-icon"
				>{enabled ? 'expand_more' : 'chevron_right'}</span
			>
			<span class="h1">{el.title}</span>
			<div class="line" />
		</div>
		{#if enabled}
			<div class="group" transition:slide={{ duration: 250 }}>
				{#if el.children}
					{#each el.children as e}
						<svelte:self el={e} {settingArray} />
					{/each}
				{/if}
			</div>
		{/if}
	</div>
{:else if el.type === 'toggle'}
	<div>
		<div class="toggle-title">
			<input type="checkbox" bind:checked={enabled} />
			<span class="toggle-header">
				{enabled ? el.activeTitle || el.title : el.inactiveTitle || el.title}
			</span>
		</div>
		{#if enabled}
			<div in:slide|local={{ delay: 200, duration: 200 }} out:slide|local={{ duration: 200 }}>
				{#each el.active as e}
					<svelte:self el={e} {settingArray} />
				{/each}
			</div>
		{:else}
			<div in:slide|local={{ delay: 200, duration: 200 }} out:slide|local={{ duration: 200 }}>
				{#each el.inactive as e}
					<svelte:self el={e} {settingArray} />
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.toggle-title {
		display: flex;
		align-items: center;
		flex-direction: row;
		justify-content: flex-start;
		margin-bottom: 10px;
		margin-left: 10px;
	}
	.toggle-header {
		margin-left: 10px;
	}
	.group-title {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding-bottom: 10px;
	}
	.group {
		padding-left: 1em;
		margin-left: 10px;
		margin-bottom: 20px;
		border-left: 2px solid var(--color-text);
	}
	.custom-icon {
		font-size: 24px;
		min-width: 1em;
		min-height: 1em;
	}
	span.h1 {
		font-size: 24px;
		margin-top: unset;
		margin-bottom: 4px;
		margin-left: 4px;
	}
	div.line {
		border-bottom: 2px solid var(--color-text);
		flex-grow: 1;
		margin-left: 10px;
	}
</style>

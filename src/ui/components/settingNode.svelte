<script lang="ts" context="module">
	import type { Writable } from 'svelte/store'
	import { writable } from 'svelte/store'
	const toggles: Record<string, Writable<boolean>> = {}
</script>

<script lang="ts">
	import { fly, slide } from '../util/accessability'
	import type { AnyGUIElement } from '../../guiStructure'
	import * as AJ from '../../settings'
	import Setting from './setting.svelte'

	export let el: AnyGUIElement
	export let settingArray: AJ.Setting<any>[]
	let setting: AJ.Setting<any>
	let toggle: Writable<boolean>

	switch (el.type) {
		case 'toggle':
			setting = Object.values(settingArray).find(s => s.id === (el as any).settingId)!
			if (!setting) throw new Error(`Setting ${el.settingId} not found`)
			break

		case 'group':
			toggle = toggles[el.title] || writable(!!el.openByDefault)
			break

		case 'setting':
			setting = Object.values(settingArray).find(s => s.id === (el as any).settingId)!
			if (!setting) throw new Error(`Setting ${el.settingId} not found`)
			break
	}
</script>

{#if el.type === 'setting'}
	<Setting {setting} />
{:else if el.type === 'group'}
	<div>
		<div class="group-title" on:click={() => toggle.update(v => !v)} on:keydown={() => {}}>
			<span class="material-icons custom-icon"
				>{$toggle ? 'expand_more' : 'chevron_right'}</span
			>
			<span class="h1">{el.title}</span>
			<div class="line" />
		</div>
		{#if $toggle}
			<div class="group" transition:$slide={{ duration: 250 }}>
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
			<input type="checkbox" bind:checked={setting.value} />
			<span class="toggle-header">
				{setting.value ? el.activeTitle || el.title : el.inactiveTitle || el.title}
			</span>
		</div>
		{#if setting.value}
			<div in:$fly|local={{ x: -20, duration: 250 }}>
				{#each el.active as e}
					<svelte:self el={e} {settingArray} />
				{/each}
			</div>
		{:else}
			<div in:$fly|local={{ x: -20, duration: 250 }}>
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

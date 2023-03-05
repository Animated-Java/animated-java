<script lang="ts">
	import type { AnyGUIElement } from '../ajUIStructure'
	import * as AJ from '../../settings'
	import FancyHeader from './fancyHeader.svelte'
	import Setting from './setting.svelte'

	export let el: AnyGUIElement
	export let settingArray: AJ.Setting<any>[]
	let setting: AJ.Setting<any>

	if (el.type === 'setting') {
		setting = Object.values(settingArray).find(s => s.id === (el as any).id)!
		if (!setting) throw new Error(`Setting ${el.id} not found`)
	}

	let visible = true
	function toggle() {
		visible = !visible
	}
</script>

{#if el.type === 'setting'}
	<Setting {setting} />
{:else if el.type === 'group'}
	<FancyHeader content={el.title} on:click={toggle} />
	{#if visible}
		<div>
			{#if el.children}
				{#each el.children as e}
					<svelte:self el={e} {settingArray} />
				{/each}
			{/if}
		</div>
	{/if}
{/if}

<style>
</style>

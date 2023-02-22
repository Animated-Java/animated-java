<script lang="ts">
	import type { AnyGUIElement } from '../uiStructure'
	import * as AJ from '../../settings'
	import FancyHeader from './fancyHeader.svelte'
	import Setting from './setting.svelte'

	export let el: AnyGUIElement
	export let settingArray: AJ.Setting<any>[]
	let setting: AJ.Setting<any>

	console.log('Node', el)
	if (el.type === 'setting') {
		setting = Object.values(settingArray).find(s => s.id === (el as any).id)!
	}
</script>

{#if el.type === 'setting'}
	<Setting {setting} />
{:else if el.type === 'group'}
	<FancyHeader content={el.title} />
	{#if el.children}
		{#each el.children as e}
			<svelte:self el={e} {settingArray} />
		{/each}
	{/if}
{/if}

<style>
</style>

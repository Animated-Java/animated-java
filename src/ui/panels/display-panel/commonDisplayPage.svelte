<script lang="ts">
	import { BlockDisplay } from '@aj/blockbench-additions/outliner-elements/blockDisplay'
	import { ItemDisplay } from '@aj/blockbench-additions/outliner-elements/itemDisplay'
	import { TextDisplay } from '@aj/blockbench-additions/outliner-elements/textDisplay'
	import Number from '@aj/svelte-components/inputs/number.svelte'
	import { CommonDisplayConfig } from '@aj/systems/node-configs'
	import EVENTS from '@aj/util/events'

	export let node: TextDisplay | BlockDisplay | ItemDisplay | Group

	const CONFIG = new CommonDisplayConfig().fromJSON(node.commonConfig)
	const LINK_STATES = CONFIG.getAllLinkedStates()

	// Key is a string, but I need it to be any to make TypeScript happy when indexing into the config object.
	function toggleLinked(key: any) {
		if (!CONFIG || !LINK_STATES) {
			console.error('Attempted to cycle common mode without a common config')
			return
		}

		const mode = LINK_STATES.get(key)
		if (mode) {
			CONFIG.makeDefault(key)
			CONFIG.setKeyInheritance(key, false)
			LINK_STATES.set(key, false)
		} else {
			CONFIG.set(key, undefined)
			CONFIG.setKeyInheritance(key, true)
			LINK_STATES.set(key, true)
		}

		Undo.initEdit({ elements: [node] })
		node.commonConfig = CONFIG.toJSON()
		Undo.finishEdit(`Set ${key} inheritance mode to ${mode}`, {
			elements: [node],
		})

		EVENTS.UPDATE_SELECTION.dispatch()
	}
</script>

<ul class="option-list">
	{#each CONFIG.keys() as key}
		{@const display = CONFIG.getPropertyDescription(key)}
		<li>
			<div>
				<div class="option-title">
					{display?.displayName}
				</div>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<i
					on:click={() => toggleLinked(key)}
					class="material-icons notranslate icon option-mode-toggle"
				>
					{LINK_STATES.get(key) ? 'link' : 'link_off'}
				</i>
			</div>
			{#if LINK_STATES.get(key) === false}
				{#if display?.displayMode === 'checkbox'}
					<div class="option-value">
						<input type="checkbox" checked={!!CONFIG[key]} />
					</div>
				{:else if display?.displayMode === 'number'}
					<div class="option-value">
						<Number
							id={key}
							bind:value={CONFIG[key]}
							min={display?.min}
							max={display?.max}
							dragStep={display?.step}
						/>
					</div>
				{:else}
					<div class="option-value">
						<input type="text" value={CONFIG[key]} />
					</div>
				{/if}
			{/if}
		</li>
	{/each}
</ul>

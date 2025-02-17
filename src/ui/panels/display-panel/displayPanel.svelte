<script lang="ts">
	import { BlockDisplay } from '@aj/blockbench-additions/outliner-elements/blockDisplay'
	import { ItemDisplay } from '@aj/blockbench-additions/outliner-elements/itemDisplay'
	import { TextDisplay } from '@aj/blockbench-additions/outliner-elements/textDisplay'
	import { CommonDisplayConfig } from '@aj/systems/node-configs'
	import EVENTS from '@aj/util/events'
	import { translate } from '@aj/util/translation'
	import { slide } from 'svelte/transition'
	import { MODE_ICONS, type CommonOptionMode } from '.'
	import TextDisplayPage from './textDisplayPage.svelte'

	let selectedThing: TextDisplay | BlockDisplay | ItemDisplay | Group | undefined
	let commonConfig: CommonDisplayConfig | undefined
	let commonOptionModes: Map<string, CommonOptionMode>
	let commonTabSelected: boolean

	EVENTS.UPDATE_SELECTION.subscribe(() => {
		selectedThing = undefined
		commonConfig = undefined
		commonOptionModes = new Map()

		if (Group.first_selected) {
			selectedThing = Group.first_selected
		} else if (TextDisplay.selected.length > 0) {
			selectedThing = TextDisplay.selected.at(0)
		} else if (BlockDisplay.selected.length > 0) {
			selectedThing = BlockDisplay.selected.at(0)
		} else if (ItemDisplay.selected.length > 0) {
			selectedThing = ItemDisplay.selected.at(0)
		}

		if (selectedThing) {
			commonConfig = new CommonDisplayConfig().fromJSON(selectedThing?.commonConfig)
			commonOptionModes = new Map<string, CommonOptionMode>(
				commonConfig.keys().map(key => {
					if (commonConfig!.getKeyInheritance(key)) {
						return [key, 'inherit']
					} else if (commonConfig!.get(key, 'local') != undefined) {
						return [key, 'custom']
					}
					return [key, 'default']
				})
			)
		}
	})

	// Key is a string, but I need it to be any to make TypeScript happy when indexing into the config object.
	function cycleCommonMode(key: any) {
		if (!selectedThing) {
			console.error('Attempted to cycle common mode without a selected thing')
			return
		}
		if (!commonConfig || !commonOptionModes) {
			console.error('Attempted to cycle common mode without a common config')
			return
		}

		const mode = commonOptionModes.get(key)
		if (mode === 'default') {
			commonOptionModes.set(key, 'custom')
			commonConfig.makeDefault(key)
		} else if (mode === 'custom') {
			commonOptionModes.set(key, 'inherit')
			commonConfig.set(key, undefined)
			commonConfig.setKeyInheritance(key, true)
		} else {
			commonOptionModes.set(key, 'default')
			commonConfig.set(key, undefined)
			commonConfig.setKeyInheritance(key, false)
		}

		console.log('Set', key, 'inheritance mode to', mode?.toUpperCase())
		Undo.initEdit({ elements: [selectedThing] })
		selectedThing.commonConfig = commonConfig.toJSON()
		Undo.finishEdit(`Set ${key} inheritance mode to ${mode?.toUpperCase()}`, {
			elements: [selectedThing],
		})

		commonConfig = commonConfig
	}
</script>

<!-- Make sure that we update the panel every time selected thing is assigned, even if it's the same value. -->
<!-- This makes certain that we have the most up-to-date properties of the text display from undo / redo events -->
{#if selectedThing}
	<div class="tab-buttons" in:slide={{ duration: 200 }}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<p
			class={'tab-button' + (!commonTabSelected ? ' tab-button-selected' : '')}
			on:click={() => {
				commonTabSelected = false
			}}
		>
			{translate(
				`panel.display.${selectedThing && Object.getPrototypeOf(selectedThing).constructor.type}.label`
			)}
		</p>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<p
			class={'tab-button' + (commonTabSelected ? ' tab-button-selected' : '')}
			on:click={() => {
				commonTabSelected = true
			}}
		>
			{translate('panel.display.common.label')}
		</p>
	</div>

	<div class="option-list-container">
		<div>
			{#if commonTabSelected && commonConfig}
				<ul class="option-list">
					{#each commonConfig.keys(true) as key}
						<li>
							<div>
								<div class="option-title">
									{translate(`panel.display.common.options.${key}`)}
								</div>
								<div class="option-mode">{commonOptionModes.get(key)}</div>
								<!-- svelte-ignore a11y-click-events-have-key-events -->
								<i
									on:click={() => cycleCommonMode(key)}
									class="material-icons notranslate icon option-mode-toggle"
								>
									{MODE_ICONS[commonOptionModes.get(key) ?? 'default']}
								</i>
							</div>
							{#if commonOptionModes.get(key) === 'custom'}
								<div class="option-value">
									<input type="text" value={commonConfig[key]} />
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{:else}
				{#key selectedThing}
					<!-- svelte-ignore missing-declaration -->
					{#if selectedThing instanceof Group}
						<!-- <div>{selectedThing.name}</div> -->
					{:else if selectedThing instanceof TextDisplay}
						<TextDisplayPage textDisplay={selectedThing} />
					{:else if selectedThing instanceof BlockDisplay}
						<!-- <div>{selectedThing.name}</div> -->
					{:else if selectedThing instanceof ItemDisplay}
						<!-- <div>{selectedThing.name}</div> -->
					{:else}
						<div>Selection has no Display Options</div>
					{/if}
				{/key}
			{/if}
		</div>
	</div>
{/if}

<style>
	:global .panel[id='panel_animated_java:display_panel'] {
		& .toolbar {
			& .bar_select {
				height: 28px;
				margin: 1px 0px;
			}
			& bb-select {
				height: 28px;
				display: flex;
				align-items: center;
				padding-top: 0;
			}
			& .sp-replacer {
				padding: 4px 18px;
				height: 28px;
				margin: 1px 0px;
			}
		}

		& .option-list-container {
			max-height: 20rem;
			overflow-y: auto;
			background-color: var(--color-back);
		}
		& .option-list {
			display: flex;
			flex-direction: column;
			gap: 8px;
			padding: 0 8px;
			margin-bottom: 8px;
		}
		& .option-list > li > div {
			display: flex;
			flex-direction: row;
			align-items: center;
			color: var(--color-subtle_text);
			justify-content: space-between;
		}
		& .option-title {
			text-align: center;
		}
		& .option-mode {
			flex-grow: 1;
			text-align: right;
			margin-right: 4px;
			text-transform: uppercase;
			font-size: 12px;
		}
		& .option-mode-toggle {
			text-align: center;
			color: var(--color-text);
		}
		& .option-mode-toggle:hover {
			color: var(--color-light);
		}
		& .option-value {
			border-left: 2px solid var(--color-accent);
			padding-left: 8px;
		}

		& .tab-buttons {
			display: grid;
			gap: 8px;
			padding: 0 8px;
			grid-template-columns: 1fr 1fr;
			margin-bottom: 8px;
		}
		& .tab-button {
			padding: 4px 8px;
			margin: unset;
			cursor: pointer;
			background-color: var(--color-button);
			border-bottom: none;
			text-align: center;
		}
		& .tab-button-selected {
			border-bottom: 2px solid var(--color-accent);
		}
	}
</style>

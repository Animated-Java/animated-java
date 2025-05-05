<script lang="ts">
	import { BlockDisplay } from '@aj/blockbench-additions/outliner-elements/blockDisplay'
	import { ItemDisplay } from '@aj/blockbench-additions/outliner-elements/itemDisplay'
	import { TextDisplay } from '@aj/blockbench-additions/outliner-elements/textDisplay'
	import { CommonDisplayConfig } from '@aj/systems/node-configs'
	import EVENTS from '@aj/util/events'
	import { Syncable } from '@aj/util/stores'
	import { translate } from '@aj/util/translation'
	import CommmonDisplayPage from './commonDisplayPage.svelte'
	import TextDisplayPage from './textDisplayPage.svelte'

	const SELECTED_NODE = new Syncable<
		TextDisplay | BlockDisplay | ItemDisplay | Group | undefined
	>(undefined)
	let isCommonTabActive: boolean
	const LINK_STATES = new Map<string, boolean>()
	let resetUniqueOptions: (() => void) | undefined

	EVENTS.UPDATE_SELECTION.subscribe(() => {
		if (Group.first_selected) {
			$SELECTED_NODE = Group.first_selected
		} else if (TextDisplay.selected.length > 0) {
			$SELECTED_NODE = TextDisplay.selected.at(0)
		} else if (BlockDisplay.selected.length > 0) {
			$SELECTED_NODE = BlockDisplay.selected.at(0)
		} else if (ItemDisplay.selected.length > 0) {
			$SELECTED_NODE = ItemDisplay.selected.at(0)
		} else {
			$SELECTED_NODE = undefined
		}
		LINK_STATES.clear()
		if ($SELECTED_NODE?.commonConfig) {
			const config = new CommonDisplayConfig().fromJSON($SELECTED_NODE.commonConfig)
			config.getAllLinkedStates().forEach((v, k) => LINK_STATES.set(k, v))
		}
	})

	function getAverageLinkedState() {
		return (
			Array.from(LINK_STATES.values()).reduce((acc, val) => acc + (val ? 1 : 0), 0) /
				LINK_STATES.size >
			0.5
		)
	}

	function toggleAllLinked() {
		if (!$SELECTED_NODE) {
			console.error('Attempted to toggle all linked without a selected node')
			return
		}
		if (!$SELECTED_NODE.commonConfig) {
			console.error('Attempted to toggle all linked without a common config')
			return
		}

		const config = new CommonDisplayConfig().fromJSON($SELECTED_NODE.commonConfig)
		const linkStates = config.getAllLinkedStates()

		const averageState = getAverageLinkedState()
		for (const key of config.keys()) {
			if (averageState) {
				config.makeDefault(key)
				config.setKeyInheritance(key, false)
				linkStates.set(key, false)
			} else {
				config.set(key, undefined)
				config.setKeyInheritance(key, true)
				linkStates.set(key, true)
			}
		}

		console.log('Toggled all common property linked states')
		Undo.initEdit({ elements: [$SELECTED_NODE] })
		$SELECTED_NODE.commonConfig = config.toJSON()
		Undo.finishEdit('Toggled all common property linked states', {
			elements: [$SELECTED_NODE],
		})
		EVENTS.UPDATE_SELECTION.dispatch()
	}
</script>

<!-- Make sure that we update the panel every time selected thing is assigned, even if it's the same value. -->
<!-- This makes certain that we have the most up-to-date properties of the text display from undo / redo events -->
{#key $SELECTED_NODE}
	{#if $SELECTED_NODE}
		<div class="nav">
			<div class="tab-buttons">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<p
					class={'tab-button' + (!isCommonTabActive ? ' tab-button-selected' : '')}
					on:click={() => {
						isCommonTabActive = false
					}}
					title={translate(
						`config.${$SELECTED_NODE && Object.getPrototypeOf($SELECTED_NODE).constructor.type}.description`
					)}
				>
					{translate(
						`config.${$SELECTED_NODE && Object.getPrototypeOf($SELECTED_NODE).constructor.type}.label`
					)}
				</p>
				{#if !!$SELECTED_NODE.commonConfig}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<p
						class={'tab-button' + (isCommonTabActive ? ' tab-button-selected' : '')}
						title={translate('config.common.description')}
						on:click={() => {
							isCommonTabActive = true
						}}
					>
						{translate('config.common.label')}
					</p>
				{/if}
			</div>
			{#if isCommonTabActive}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<i
					on:click={() => toggleAllLinked()}
					class="material-icons notranslate icon option-mode-toggle toggle-all-links"
					title={getAverageLinkedState()
						? translate('panel.display.set_all_unlinked.tooltip')
						: translate('panel.display.set_all_linked.tooltip')}
				>
					{getAverageLinkedState() ? 'link_off' : 'link'}
				</i>
			{:else}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<i
					on:click={() => resetUniqueOptions?.()}
					class="material-icons notranslate icon option-mode-toggle toggle-all-links"
					title={translate('panel.display.reset_all.tooltip')}
				>
					delete
				</i>
			{/if}
		</div>

		<div class="option-list-container">
			<div>
				{#if isCommonTabActive}
					<CommmonDisplayPage node={$SELECTED_NODE} />
				{:else}
					<!-- svelte-ignore missing-declaration -->
					{#if $SELECTED_NODE instanceof Group}
						<!-- <div>{selectedThing.name}</div> -->
					{:else if $SELECTED_NODE instanceof TextDisplay}
						<TextDisplayPage textDisplay={$SELECTED_NODE} bind:resetUniqueOptions />
					{:else if $SELECTED_NODE instanceof BlockDisplay}
						<!-- <div>{selectedThing.name}</div> -->
					{:else if $SELECTED_NODE instanceof ItemDisplay}
						<!-- <div>{selectedThing.name}</div> -->
					{:else}
						<div>Selection has no Display Options</div>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
{/key}

<style>
	.nav {
		display: flex;
		flex-direction: row;
	}

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
			max-height: 16rem;
			overflow-y: scroll;
			background-color: var(--color-back);
		}
		& .option-list {
			display: flex;
			flex-direction: column;
		}
		& .option-list > li {
			padding: 4px 8px;
		}
		& .option-list > li:hover {
			background-color: var(--color-selected);
			& .option-title {
				color: var(--color-light);
			}
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
			color: var(--color-text);
		}
		& .option-mode-toggle {
			text-align: center;
			color: var(--color-subtle_text);
		}
		& .option-mode-toggle:hover {
			color: var(--color-light);
		}
		& .toggle-all-links {
			margin-right: 8px;
			display: flex;
			align-items: center;
			margin-bottom: 8px;
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
			flex-grow: 1;
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

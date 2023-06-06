<script lang="ts" context="module">
	localStorage.setItem('animated_java_settings_support_me_popup', 'true')
</script>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte'
	import { fly } from '../util/accessability'
	import { AnimatedJavaExporter } from '../../exporter'
	import { projectSettingStructure } from '../../projectSettings'
	import * as AJ from '../../settings'
	import { translate } from '../../util/translation'
	import FancyHeader from './fancyHeader.svelte'
	import AJUINode from './settingNode.svelte'
	// @ts-ignore
	import kofiButton from '../../assets/kofi_s_tag_white.webp'
	// @ts-ignore
	import heart from '../../assets/heart.png'
	import { text } from 'stream/consumers'
	// import { PIXEL_FILTER } from '../../minecraft'

	let settingArray = Object.values(Project!.animated_java_settings!) as AJ.Setting<any>[]
	console.log('Project Settings', settings, projectSettingStructure)

	let selectedExporter: AnimatedJavaExporter | undefined

	function updateSelectedExporter() {
		selectedExporter = AnimatedJavaExporter.all.find(exporter => {
			return exporter.id === Project!.animated_java_settings!.exporter.selected?.value
		})
	}

	updateSelectedExporter()

	let unsub: () => void
	requestAnimationFrame(() => {
		unsub = Project!.animated_java_settings!.exporter.subscribe(() => {
			updateSelectedExporter()
			// console.log('Selected exporter changed to', selectedExporter)
		})
	})
	onDestroy(() => {
		unsub()
	})

	function getSettingArray(exporter: AnimatedJavaExporter): any {
		return Project!.animated_java_exporter_settings![exporter.id]
	}

	let xButtonHovered = false
	let showSupportMePopup = false

	function clickSupportMeXButton() {
		localStorage.setItem('animated_java_settings_support_me_popup', 'false')
		showSupportMePopup = false
	}

	requestAnimationFrame(() => {
		showSupportMePopup =
			localStorage.getItem('animated_java_settings_support_me_popup') !== 'false'
	})

	function clickSupportMebutton() {
		Blockbench.openLink('https://ko-fi.com/snavesutit')
	}
</script>

{#if showSupportMePopup}
	<div class="support-me-popup" transition:$fly|local={{ duration: 500, opacity: 0, y: 25 }}>
		<div class="support-me-popup-sub-container">
			<div
				style="display:flex; flex-direction: row; align-items: center; padding-top: 8px; margin-left: 16px; margin-right: 16px;"
			>
				<img src={heart} alt="heart" class="heart" />
				<p>Animated Java?</p>
			</div>
			<div class="support-me-button-container">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<img
					class="support-me-button"
					src={kofiButton}
					alt="Ko-fi Button"
					on:click={clickSupportMebutton}
				/>
			</div>
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<span
			class="material-icons x-button"
			on:mouseenter={() => (xButtonHovered = true)}
			on:mouseleave={() => (xButtonHovered = false)}
			on:click={clickSupportMeXButton}
		>
			{xButtonHovered ? 'mood_bad' : 'close'}
		</span>
	</div>
{/if}

<div class="dialog-content">
	{#each projectSettingStructure as el}
		<AJUINode {el} {settingArray} />
	{/each}

	{#if selectedExporter}
		{#key selectedExporter}
			<div in:$fly|local={{ x: -20, duration: 250 }}>
				<FancyHeader
					content={translate('animated_java.project_settings.exporter_settings', {
						exporter: selectedExporter.name,
					})}
				/>
				{#each selectedExporter.settingsStructure as el}
					<AJUINode {el} settingArray={getSettingArray(selectedExporter)} />
				{/each}
			</div>
		{/key}
	{/if}
</div>

<style>
	/* .material-symbols-outlined {
		font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48;
	} */
	.support-me-popup {
		position: absolute;
		white-space: nowrap;
		left: 100%;
		top: 30px;
		background: #00aced;
		border-radius: 0px 8px 8px 0px;
		display: flex;
	}

	.support-me-popup-sub-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.support-me-popup-sub-container > * > p {
		font-family: 'MinecraftFull';
		font-size: 16px;
		color: white;
		/* filter: var(--filter); */
		padding-left: 8px;
		margin: 0px;
	}

	.heart {
		display: flex;
		align-items: center;
		/* color: #f15e5f; */
		width: 21px;
		height: 21px;
		transition: transform 0.1s ease-in-out;
	}

	.heart:hover {
		transform: scale(1.25);
	}

	.x-button {
		margin-right: 4px;
		margin-top: 2px;
		color: black;
		height: fit-content;
		font-size: 24px;
	}

	.support-me-button-container {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 10px;
	}

	.support-me-button {
		width: 100%;
		image-rendering: auto;
		transition: transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out;
		border-radius: 8px;
	}
	.support-me-button:hover {
		transform: scale(1.05);
		box-shadow: 0px 0px 10px 0px white;
	}

	div.dialog-content {
		overflow-y: scroll;
		max-height: 700px;
		padding-right: 10px;
	}
</style>

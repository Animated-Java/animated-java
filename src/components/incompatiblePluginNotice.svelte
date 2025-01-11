<script lang="ts">
	import { isIncompatiblePlugin } from '../interface/popup/incompatabilityPopup'
	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'

	export let selectedPlugin: Valuable<BBPlugin | null>
</script>

{#if $selectedPlugin && isIncompatiblePlugin($selectedPlugin)}
	<div>
		<i class="material-icons icon">warning</i>
		{translate('dialog.incompatability_notice')}
	</div>
{/if}

<style>
	div {
		display: flex;
		align-items: center;
		gap: 4px;
		background-color: var(--color-warning);
		color: var(--color-accent_text);
		padding: 4px 8px;
		width: fit-content;
		border-radius: 6px;
		font-weight: 600;
		margin-top: 8px;
	}
</style>

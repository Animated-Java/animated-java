<script lang="ts">
	import type { IInfoPopup } from '../../../settings'
	import { translate } from '../../../util/translation'

	const translations = {
		body: translate('animated_java.popup.failed_project_export_readiness.body'),
	}

	export let infos: IInfoPopup[]
</script>

<div class="container">
	{#each translations.body.split('\n') as line}
		<p>{line}</p>
	{/each}
	<div class="spacer" />
	<div class="error-list">
		{#each infos as info}
			<div class="error">
				<div class="error-title">
					<span class="material-icons" style="color: var(--color-error);">error</span>
					<p style="margin-left: 0.5em; text-decoration: underline;">
						{info.title}
					</p>
				</div>
				<div class="error-body">
					<h5>{info.lines[0]}</h5>
					{#each info.lines.slice(1) as line}
						<p class="sub-heading">{line}</p>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	h5 {
		margin: 0;
	}
	p.sub-heading {
		margin: 0 0 0 1em;
	}
	div.spacer {
		min-height: 10px;
	}
	div.container {
		display: flex;
		overflow-y: auto;
		flex-direction: column;
		align-items: stretch;
	}
	div.error-list {
		display: grid;
		grid-gap: 10px;
	}
	div.error {
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}
	div.error-title {
		display: flex;
		flex-direction: row;
		align-items: center;
		background-color: var(--color-button);
		font-weight: 600;
		padding: 0.5em;
	}
	div.error-body {
		display: flex;
		flex-direction: column;
		background-color: var(--color-back);
		padding: 0.5em 0.75em;
		border: 2px solid var(--color-border);
		border-top: unset;
	}
</style>

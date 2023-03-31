<script lang="ts">
	import { fly } from '../util/accessability'
	import type { IInfoPopup } from '../../settings'

	export var type: IInfoPopup['type']
	export var popup: IInfoPopup
</script>

<div class="flex-column {type}" style="margin-bottom: 10px; overflow:hidden;">
	{#key popup.title}
		<div
			class="flex-row"
			in:$fly={{
				x: -20,
				duration: 250,
			}}
		>
			<div class="flex-column">
				<div class="flex-row">
					<div class="material-icons {type}" style="margin-right:10px">{type}</div>
					<p style="text-decoration:underline;">{popup.title}</p>
				</div>
				{#key popup.lines.join('\n')}
					{#if popup.lines.length > 0}
						{#each popup.lines as line}
							<div
								class="flex-row"
								in:$fly={{
									x: -20,
									duration: 250,
									delay: 200,
								}}
							>
								<div
									class="material-icons {type}"
									style="margin-right:10px; visibility:hidden;"
								>
									{type}
								</div>
								<p style="margin:0px">{line}</p>
							</div>
						{/each}
					{/if}
				{/key}
			</div>
		</div>
	{/key}
</div>

<style>
	.warning {
		color: var(--color-warning);
	}

	.error {
		color: var(--color-error);
	}

	div.flex {
		display: flex;
		align-items: center;
	}

	div.flex-column {
		display: flex;
		align-items: center;
		flex-direction: column;
		align-items: flex-start;
	}

	div.flex-row {
		display: flex;
		align-items: center;
		flex-direction: row;
	}
</style>

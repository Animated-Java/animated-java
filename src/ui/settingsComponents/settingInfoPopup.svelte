<script lang="ts">
	import { bounceOut } from 'svelte/easing'
	import { fade, fly } from 'svelte/transition'
	import type { IAJSettingError, IAJSettingWarning } from '../../settings'

	export var type: 'error' | 'warning'
	export var infos: (IAJSettingError | IAJSettingWarning)[]
</script>

<div class="flex_column {type}" style="margin-top: 10px; overflow:hidden;">
	{#each infos as info, index}
		{#key info.title}
			<div
				class="flex_row"
				in:fly={{
					x: -20,
					duration: 250,
					delay: 100 * index,
				}}
				out:fade={{ duration: 0 }}
			>
				<div class="flex_column">
					<div class="flex_row">
						<div class="material-icons {type}" style="margin-right:10px">{type}</div>
						<p style="text-decoration:underline;">{info.title}</p>
					</div>
					{#key info.lines.join('\n')}
						{#if info.lines.length > 0}
							{#each info.lines as line}
								<div
									class="flex_row"
									in:fly={{
										x: -20,
										duration: 250,
										delay: 100 + 100 * index,
									}}
									out:fade={{ duration: 0 }}
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
	{/each}
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

	div.flex_column {
		display: flex;
		align-items: center;
		flex-direction: column;
		align-items: flex-start;
	}

	div.flex_row {
		display: flex;
		align-items: center;
		flex-direction: row;
	}
</style>

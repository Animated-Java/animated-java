<script lang="ts">
	import { translate } from './host'
	import { COLORWAY_PREVIEW, PAINT_CONTEXT, previewColorway } from './paintState'
	import { getStripColors } from './preview'

	const context = $derived($PAINT_CONTEXT)
	const data = $derived(context?.set.palette_set)
	const previewed = $derived(context && $COLORWAY_PREVIEW[context.set.uuid])
	const permutation = $derived(
		data?.permutations.find(p => p.uuid === (previewed ?? context?.permutation))
	)

	let colors = $state<string[]>([])

	$effect(() => {
		if (!data) {
			colors = []
			return
		}
		let current = true
		void getStripColors(data, permutation?.strip ?? data.key).then(resolved => {
			if (current) colors = resolved ?? []
		})
		return () => (current = false)
	})

	function openColorwayMenu(event: MouseEvent) {
		if (!context || !data) return
		const { set } = context
		const radio = (checked: boolean) =>
			checked ? 'radio_button_checked' : 'radio_button_unchecked'
		new Menu([
			{
				name: translate('paint.as_assigned'),
				icon: radio(!previewed),
				click: () => previewColorway(set, undefined),
			},
			new MenuSeparator('permutations'),
			...data.permutations.map(p => ({
				name: p.suffix,
				icon: radio(previewed === p.uuid),
				click: () => previewColorway(set, p.uuid),
			})),
		]).open(event)
	}

	function pick(color: string, secondary: boolean) {
		ColorPanel.set(color.slice(0, 7), secondary)
	}
</script>

{#if context && data}
	<div class="strip">
		<div class="head">
			<i class="material-icons icon set-icon">palette</i>
			<span class="name" title={context.set.name}>{context.set.name}</span>
			<button
				class="colorway"
				class:previewing={!!previewed}
				title={translate('paint.colorway')}
				onclick={openColorwayMenu}
			>
				<i class="material-icons icon">{previewed ? 'visibility' : 'texture'}</i>
				<span>{permutation?.suffix ?? translate('dialog.set.key')}</span>
				<i class="material-icons icon">arrow_drop_down</i>
			</button>
		</div>
		<div class="swatches">
			{#each colors as color, i (i)}
				<button
					class="swatch"
					style:background={color}
					title={color}
					onclick={() => pick(color, false)}
					oncontextmenu={event => {
						event.preventDefault()
						pick(color, true)
					}}
				></button>
			{/each}
		</div>
	</div>
{/if}

<style>
	.strip {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 4px 8px 6px;
		border-bottom: 1px solid var(--color-border);
	}
	.head {
		display: flex;
		align-items: center;
		gap: 4px;
		min-width: 0;
	}
	.set-icon {
		color: var(--color-accent);
		font-size: 18px;
	}
	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	/* Undo Blockbench's global button style */
	button {
		min-width: 0;
		height: auto;
		margin: 0;
		padding: 0;
		border: none;
		box-shadow: none;
		background: none;
		color: inherit;
		cursor: pointer;
	}
	.colorway {
		display: flex;
		align-items: center;
		gap: 2px;
		max-width: 60%;
		padding: 1px 2px 1px 6px;
		border-radius: 3px;
		background: var(--color-back);
		font-family: var(--font-code, monospace);
		font-size: 0.85em;
	}
	.colorway span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.colorway i {
		font-size: 16px;
	}
	.colorway.previewing {
		color: var(--color-accent);
	}
	.colorway:hover {
		color: var(--color-light);
	}
	.swatches {
		display: flex;
		flex-wrap: wrap;
		gap: 2px;
	}
	.swatch {
		width: 20px;
		height: 20px;
		border-radius: 2px;
		outline: 1px solid var(--color-border);
		outline-offset: -1px;
	}
	.swatch:hover {
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}
</style>

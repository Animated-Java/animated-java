<script lang="ts">
	import { translate } from '../../host'
	import { findPackSources, readAtlasFile, type IFoundSource } from '../../packSources'
	import type { IReferenceSelection } from './referencePicker'

	interface Props {
		onchange: (selection: IReferenceSelection | undefined) => void
	}

	let { onchange }: Props = $props()

	let sources = $state.raw<IFoundSource[]>([])
	let loading = $state(true)
	let selectedIndex = $state<number | undefined>()
	let bases = $state<string[]>([])
	let suffixes = $state<string[]>([])

	const selected = $derived(selectedIndex === undefined ? undefined : sources[selectedIndex])

	void findPackSources()
		.then(found => (sources = found))
		.finally(() => (loading = false))

	$effect(() => {
		onchange(
			selected ? { found: selected, bases: [...bases], suffixes: [...suffixes] } : undefined
		)
	})

	function select(index: number) {
		selectedIndex = index
		bases = [...sources[index].source.textures]
		suffixes = Object.keys(sources[index].source.permutations)
	}

	function toggle(list: string[], value: string): string[] {
		return list.includes(value) ? list.filter(v => v !== value) : [...list, value]
	}

	function pickAtlasFile() {
		Blockbench.import(
			{
				type: translate('dialog.reference.atlas_file_type'),
				extensions: ['json'],
				readtype: 'text',
				resource_id: 'palette',
			},
			async files => {
				const file = files[0]?.path
				if (!file) return
				const result = await readAtlasFile(file)
				if (!result.ok) {
					Blockbench.showQuickMessage(
						translate('dialog.reference.error.' + result.error, result.atlas ?? ''),
						4000
					)
					return
				}
				if (!result.sources.length) {
					Blockbench.showQuickMessage(translate('dialog.reference.no_sources_in_file'))
					return
				}
				sources = [...result.sources, ...sources]
				select(0)
			}
		)
	}

	function sourceLabel(found: IFoundSource): string {
		return found.file ?? translate('dialog.reference.from_packs', found.atlas)
	}
</script>

<div class="dialog-container">
	<div class="list-header">
		<div>{translate('dialog.reference.sources')}</div>
		<div class="spacer"></div>
		<button class="text-button" onclick={pickAtlasFile}>
			<i class="material-icons icon">folder_open</i>
			{translate('dialog.reference.pick_atlas_file')}
		</button>
	</div>
	<ul class="list">
		{#if loading}
			<div class="empty">{translate('dialog.reference.loading')}</div>
		{:else}
			{#each sources as found, i (i)}
				<li>
					<label class="row" class:selected={selectedIndex === i}>
						<input
							type="radio"
							name="palette-source"
							checked={selectedIndex === i}
							onchange={() => select(i)}
						/>
						<span class="grow">
							<span class="mono">{found.source.palette_key}</span>
							<span class="muted">
								{translate(
									'dialog.reference.source_summary',
									String(found.source.textures.length),
									String(Object.keys(found.source.permutations).length)
								)}
							</span>
							<span class="muted path">{sourceLabel(found)}</span>
						</span>
					</label>
				</li>
			{:else}
				<div class="empty">{translate('dialog.reference.no_sources')}</div>
			{/each}
		{/if}
	</ul>

	{#if selected}
		<div class="columns">
			<div class="column">
				<div class="list-header">
					<div>{translate('dialog.reference.bases')}</div>
				</div>
				<ul class="list scroll">
					{#each selected.source.textures as base (base)}
						<li>
							<label class="row">
								<input
									type="checkbox"
									checked={bases.includes(base)}
									onchange={() => (bases = toggle(bases, base))}
								/>
								<span class="grow mono" title={base}
									>{base.replace(/^.*[:/]/, '')}</span
								>
							</label>
						</li>
					{/each}
				</ul>
			</div>
			<div class="column">
				<div class="list-header">
					<div>{translate('dialog.reference.permutations')}</div>
				</div>
				<ul class="list scroll">
					{#each Object.keys(selected.source.permutations) as suffix (suffix)}
						<li>
							<label class="row">
								<input
									type="checkbox"
									checked={suffixes.includes(suffix)}
									onchange={() => (suffixes = toggle(suffixes, suffix))}
								/>
								<span class="grow mono">{suffix}</span>
							</label>
						</li>
					{/each}
				</ul>
			</div>
		</div>
		<div class="hint">
			{translate(
				'dialog.reference.count',
				String(bases.length * suffixes.length),
				String(bases.length),
				String(suffixes.length)
			)}
		</div>
	{/if}
</div>

<style>
	.dialog-container {
		display: flex;
		flex-direction: column;
		max-height: 75vh;
		overflow-x: hidden;
		overflow-y: auto;
		padding-bottom: 8px;
	}
	.list-header {
		display: flex;
		align-items: center;
		margin: 8px 16px 0;
		gap: 8px;
	}
	.spacer,
	.grow {
		flex-grow: 1;
		min-width: 0;
	}
	.grow {
		display: flex;
		flex-direction: column;
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 4px 16px 0;
		padding: 4px;
		min-height: 36px;
		max-height: 220px;
		overflow-y: auto;
		background: var(--color-back);
		border-radius: 6px;
		list-style: none;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px;
		border-radius: 4px;
		cursor: pointer;
	}
	.row:hover,
	.row.selected {
		background: var(--color-button);
	}
	.columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}
	.column {
		min-width: 0;
	}
	.mono {
		font-family: var(--font-code, monospace);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.muted {
		color: var(--color-subtle_text);
		font-size: 0.85em;
	}
	.path {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.hint {
		margin: 8px 16px 0;
		color: var(--color-subtle_text);
		font-size: 0.9em;
	}
	.empty {
		color: var(--color-subtle_text);
		font-style: italic;
		text-align: center;
		padding: 12px;
	}
	.text-button {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.text-button i {
		font-size: 18px;
	}
</style>

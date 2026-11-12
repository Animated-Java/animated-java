<script lang="ts">
	interface Props {
		/**
		 * `key` and `palette` show a color; `add` and `missing` are empty slots, which act on a
		 * plain click.
		 */
		kind: 'key' | 'palette' | 'add' | 'missing'
		color?: string
		title?: string
		/** For the lifted column to find a palette swatch by. */
		id?: string
		editing?: boolean
		/** Highlighted as the counterpart of a swatch being dragged elsewhere. */
		following?: boolean
		/** Travelling with a dragged key swatch, so its real cell leaves a gap. */
		lifted?: boolean
		/** A palette color past the end of the key. */
		extra?: boolean
		locked?: boolean
		onclick?: (event: MouseEvent) => void
		/** Opens the swatch's popover, from a right-click, Enter or Space. */
		onedit?: (anchor: HTMLElement) => void
	}

	let {
		kind,
		color,
		title,
		id,
		editing = false,
		following = false,
		lifted = false,
		extra = false,
		locked = false,
		onclick,
		onedit,
	}: Props = $props()

	function onContextMenu(event: MouseEvent) {
		if (!onedit) return
		event.preventDefault()
		onedit(event.currentTarget as HTMLElement)
	}

	// Bound with `onkeydowncapture`, so it runs before the drag zone claims the keys.
	function onKeyDown(event: KeyboardEvent) {
		if (!onedit || (event.key !== 'Enter' && event.key !== ' ')) return
		event.preventDefault()
		event.stopPropagation()
		onedit(event.currentTarget as HTMLElement)
	}
</script>

{#if kind === 'key' || kind === 'palette'}
	<!-- Not a real button: the drag zone won't start a drag from an element with a `value`. -->
	<span
		class="swatch {kind}-swatch"
		class:editing
		class:following
		class:lifted
		class:extra
		role="button"
		tabindex="0"
		data-id={id}
		style:background={color}
		{title}
		{onclick}
		oncontextmenu={onContextMenu}
		onkeydowncapture={onKeyDown}
	></span>
{:else if onclick}
	<button class="swatch {kind}" class:editing class:locked {title} {onclick}>
		{#if kind === 'add'}<i class="material-icons">add</i>{/if}
	</button>
{:else}
	<span class="swatch {kind}"></span>
{/if}

<style>
	.swatch {
		display: block;
		width: 28px;
		flex: none;
		min-width: 0;
		height: 26px;
		margin: 0;
		padding: 0;
		border: none;
		border-radius: 3px;
		box-shadow: none;
		cursor: pointer;
	}
	.swatch.editing,
	.swatch.following,
	.swatch:hover,
	.swatch:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}
	span.swatch.missing {
		cursor: default;
		outline: none;
	}
	.swatch.add {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: 1px dashed var(--color-subtle_text);
		color: var(--color-subtle_text);
	}
	.swatch.add i {
		font-size: 16px;
		margin: 0;
	}
	.swatch.missing {
		background: none;
		border: 1px dashed var(--color-subtle_text);
	}
	.lifted {
		visibility: hidden;
	}
	/* Palette colors past the end of the key make Minecraft skip the palette */
	.swatch.extra {
		outline: 2px solid var(--color-error, #ff5252);
		outline-offset: -2px;
	}
	/* Reference sets can't change these; clicking explains why */
	.locked {
		opacity: 0.45;
	}
</style>

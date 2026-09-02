<script lang="ts">
	interface Props {
		/** Textures to choose from. */
		textures: Texture[]
		/** UUID of the selected texture. */
		value: string
		/** Fallback image for a missing / unloaded texture. */
		missingSrc: string
		onchange: (uuid: string) => void
	}

	let { textures, value, missingSrc, onchange }: Props = $props()

	let open = $state(false)
	let menuStyle = $state('')
	let trigger: HTMLButtonElement
	let menu: HTMLElement | undefined = $state()

	const selected = $derived(textures.find(t => t.uuid === value))

	function srcFor(texture: Texture | undefined): string {
		return texture?.img?.src ?? missingSrc
	}

	function position() {
		const rect = trigger.getBoundingClientRect()
		const spaceBelow = window.innerHeight - rect.bottom
		const flipUp = spaceBelow < 260 && rect.top > spaceBelow
		menuStyle =
			`min-width:${rect.width}px;left:${rect.left}px;` +
			(flipUp ? `bottom:${window.innerHeight - rect.top}px;` : `top:${rect.bottom}px;`)
	}

	function toggle() {
		open = !open
		if (open) position()
	}

	function pick(uuid: string) {
		open = false
		if (uuid !== value) onchange(uuid)
	}

	function onPointerDown(event: PointerEvent) {
		const target = event.target as Node
		if (open && !trigger.contains(target) && !menu?.contains(target)) open = false
	}

	// The menu is portalled to <body> to escape the dialog's overflow clipping, so
	// its fixed position goes stale when something else scrolls or the window
	// resizes. Close it then - but ignore scrolling inside the menu itself.
	$effect(() => {
		if (!open) return
		const close = () => (open = false)
		const onScroll = (event: Event) => {
			if (menu && event.target instanceof Node && menu.contains(event.target)) return
			open = false
		}
		window.addEventListener('scroll', onScroll, true)
		window.addEventListener('resize', close)
		return () => {
			window.removeEventListener('scroll', onScroll, true)
			window.removeEventListener('resize', close)
		}
	})

	function portal(node: HTMLElement) {
		document.body.appendChild(node)
		return {
			destroy() {
				node.remove()
			},
		}
	}
</script>

<svelte:window
	onpointerdown={onPointerDown}
	onkeydown={e => e.key === 'Escape' && (open = false)}
/>

<div class="texture-select">
	<button type="button" class="trigger" bind:this={trigger} onclick={toggle}>
		<span class="thumb" style="--tex:url('{srcFor(selected)}')"></span>
		<span class="name">{selected?.name ?? '—'}</span>
		<i class="material-icons chevron">{open ? 'arrow_drop_up' : 'arrow_drop_down'}</i>
	</button>

	{#if open}
		<ul class="menu" bind:this={menu} style={menuStyle} use:portal>
			{#each textures as texture (texture.uuid)}
				<li>
					<button
						type="button"
						class:selected={texture.uuid === value}
						onclick={() => pick(texture.uuid)}
					>
						<span class="thumb" style="--tex:url('{srcFor(texture)}')"></span>
						<span class="name">{texture.name}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.texture-select {
		flex-grow: 1;
		min-width: 0;
	}
	.trigger,
	.menu button {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 6px;
		border: none;
		cursor: pointer;
		text-align: left;
		height: fit-content;
	}
	.trigger {
		background-color: var(--color-button);
		color: var(--color-text);
		height: fit-content;
	}
	.menu button {
		background: var(--color-bright_ui);
		color: var(--color-bright_ui_text);
		border-radius: 0;
	}
	/* pad between touching buttons */
	.menu :global(button + button) {
		margin-top: 4px;
	}
	.trigger:hover,
	.menu button:hover {
		background-color: var(--color-accent);
		color: var(--color-accent_text);
	}
	.menu button.selected {
		background-color: var(--color-menu_separator);
	}
	.thumb {
		flex-shrink: 0;
		width: 64px;
		height: 64px;
		image-rendering: pixelated;
		background-image:
			var(--tex, none),
			repeating-conic-gradient(var(--color-checkerboard) 0% 25%, var(--color-ui) 0% 50%);
		background-size:
			contain,
			12px 12px;
		background-position:
			center,
			top left;
		background-repeat: no-repeat, repeat;
		border: 1px solid var(--color-border);
	}
	.name {
		flex-grow: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.chevron {
		flex-shrink: 0;
	}
	.menu {
		position: fixed;
		z-index: 10000;
		margin: 0;
		max-height: 25vh;
		max-width: 90vw;
		overflow-y: auto;
		list-style: none;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
		background: var(--color-bright_ui);
	}
	.menu li {
		list-style: none;
	}
</style>

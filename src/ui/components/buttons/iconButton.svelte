<script lang="ts">
	export let onClick: () => void
	export let icon: string
	export let onHoverChange: ((isHovered: boolean) => void) | undefined = undefined
	export let title: string = ''
	export let disabled: boolean = false
	export let buttonStyle: string = ''
	export let iconStyle: string = 'margin:0px'
	let mouseHoverState = false
	let lastMousePosition: { x: number; y: number } = { x: 0, y: 0 }

	function updateMouseHoverState(event: MouseEvent) {
		if (mouseHoverState) lastMousePosition = { x: 0, y: 0 }
		if (
			Math.abs(lastMousePosition.x - event.clientX) < 10 &&
			Math.abs(lastMousePosition.y - event.clientY) < 10
		)
			return
		if (onHoverChange) onHoverChange(mouseHoverState)
		lastMousePosition = {
			x: event.clientX,
			y: event.clientY,
		}
	}

	function onMouseEnter() {
		mouseHoverState = true
	}

	function onMouseLeave() {
		mouseHoverState = false
	}
</script>

<svelte:window on:mousemove={updateMouseHoverState} />

<button
	{title}
	{disabled}
	style={buttonStyle}
	on:click|stopPropagation={onClick}
	on:mouseenter={onMouseEnter}
	on:mouseleave={onMouseLeave}
>
	<span class="material-icons" style={iconStyle}>{icon}</span>
</button>

<style>
	button {
		all: unset !important;

		display: flex !important;
		justify-content: center !important;
		align-content: center !important;
		flex-wrap: wrap !important;

		background-color: var(--color-button) !important;
		height: 34px !important;
		width: 34px !important;
		min-height: 34px !important;
		min-width: 34px !important;
		line-height: 10px !important;
		font-size: 20px !important;
		margin-left: 10px !important;
	}

	button:hover {
		color: var(--color-accent_text) !important;
		background-color: var(--color-accent) !important;
	}
</style>

<script lang="ts">
	export let onClick: () => void
	export let icon: string
	export let onHoverChange: ((isHovered: boolean) => void) | undefined = undefined
	export let title: string = ''
	export let disabled: boolean = false
	export let buttonStyle: string = ''
	export let iconStyle: string = 'margin:0px'
</script>

<button
	{title}
	{disabled}
	style={buttonStyle}
	on:click|stopPropagation={onClick}
	on:mouseenter={() => onHoverChange && onHoverChange(true)}
	on:mouseleave={() => onHoverChange && onHoverChange(false)}
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

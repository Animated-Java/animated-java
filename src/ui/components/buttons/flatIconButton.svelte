<script lang="ts">
	export let onClick: (event: MouseEvent) => void
	export let icon: string
	export let title: string = ''
	export let disabled: boolean = false
	export let hovered: boolean = false
	export let buttonStyle: string = ''
	export let iconStyle: string = ''
</script>

<button
	{title}
	{disabled}
	style={buttonStyle}
	on:click|stopPropagation={onClick}
	on:mouseenter={() => (hovered = true)}
	on:mouseleave={() => (hovered = false)}
>
	<span
		class="material-icons"
		style={iconStyle + (disabled ? 'color: var(--color-subtle_text)' : '')}
	>
		{icon}
	</span>
</button>

<style>
	button {
		all: unset !important;

		display: flex !important;
		justify-content: center !important;
		align-content: center !important;
		flex-wrap: wrap !important;

		margin-right: 0.2em !important;
	}

	button:hover {
		color: var(--color-light) !important;
	}
</style>

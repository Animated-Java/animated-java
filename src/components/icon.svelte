<script lang="ts" context="module">
	import { onDestroy } from 'svelte'
	import AnimatedJavaIcon from '../assets/animated_java_icon.svg'
</script>

<script lang="ts">
	let selected = false

	const parent = document.querySelector('[format=animated_java_blueprint]')!
	const interval = setInterval(() => {
		selected = parent.classList.contains('selected')
	}, 16)

	onDestroy(() => {
		clearInterval(interval)
	})
</script>

<span class="icon_wrapper f_left">
	<img src={AnimatedJavaIcon} alt="" />
</span>

<style>
	img {
		border-radius: 4px;
		width: 24px;
		height: 24px;
		margin-left: 0.5px;
		margin-top: 2px;
		box-shadow: 1px 1px 1px #000000aa;
	}
</style>

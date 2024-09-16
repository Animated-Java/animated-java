<script lang="ts" context="module">
	import AnimatedJavaIcon from '../assets/animated_java_icon.svg'
</script>

<span class="icon_wrapper f_left" id="animated_java:icon">
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
	:global([format='animated_java_blueprint'] label) {
		color: #00aced;
	}
	:global([format='animated_java_blueprint']:hover label) {
		color: #68c8eb;
	}
	:global(.selected[format='animated_java_blueprint'] label) {
		color: var(--color-accent_text) !important;
	}
	:global(code.animated-java-code) {
		background-color: var(--color-back);
		border-radius: 4px;
		padding: 2px 4px;
		font-size: 15px;
		font-family: var(--font-code);
		align-self: end;
	}
</style>

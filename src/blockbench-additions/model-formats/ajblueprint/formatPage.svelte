<script lang="ts">
	import AnimatedJavaIcon from '@assets/icons/animated_java_icon.svg'
	import { BLUEPRINT_FORMAT } from '.'

	const TITLE = document.querySelector('#format_page_animated_java_blueprint')
		?.children[1] as HTMLHeadingElement

	if (TITLE) {
		let previousID = TITLE.parentElement?.id
		if (!TITLE.children.namedItem('format_icon')) {
			const img = new Image(48, 48)
			img.id = 'format_icon'
			img.src = AnimatedJavaIcon
			img.style.marginRight = '16px'
			img.style.borderRadius = '6px'
			img.style.boxShadow = '2px 2px 2px #000000aa'
			TITLE.prepend(img)
			previousID = undefined
			setInterval(() => {
				if (TITLE.parentElement?.id === previousID) return
				if (TITLE.parentElement?.id === 'format_page_animated_java_blueprint') {
					img.style.display = 'block'
					TITLE.style.display = 'flex'
					TITLE.style.alignItems = 'center'
					TITLE.style.fontWeight = 'normal'
				} else {
					img.style.display = 'none'
					TITLE.style.fontWeight = 'lighter'
				}
				previousID = TITLE.parentElement?.id
			}, 16)
		}
	} else {
		throw new Error('Format page title not found!')
	}

	function createBlueprint() {
		newProject(BLUEPRINT_FORMAT)
		requestAnimationFrame(() => {
			Project!.openSettings()
		})
	}
</script>

<p class="format_description">Create advanced animated models for Vanilla Java Edition</p>

<p class="format_target">
	<b>Target</b>:
	<span>Minecraft: Java Edition</span>
</p>

<h3 class="markdown">
	<p class="markdown">Getting Started</p>
</h3>

<p>
	<a href="https://animated-java.dev/docs/getting-started/creating-a-blueprint"
		>Check out the Docs</a
	> to learn how to use Animated Java.
</p>

<h3 class="markdown">
	<p class="markdown">Good to know:</p>
</h3>
<ul class="markdown">
	<li class="markdown">
		The rotations of elements are limited to 22.5 degree steps, and only one axis can be rotated
		at a time. However, the rotation of bones is not restricted.
	</li>
	<li class="markdown">
		Documentation for Animated Java can be found at <a href="https://animated-java.dev/docs"
			>https://animated-java.dev/docs</a
		>
	</li>
</ul>

<div class="button_bar">
	<button on:click={() => createBlueprint()}>
		<i class="material-icons">arrow_forward</i>
		Create new AJ Blueprint
	</button>
</div>

<style>
	button {
		width: 100%;
		height: 40px;
	}
	li {
		margin-left: 24px;
	}
</style>

<script lang="ts">
	import { fly } from '../../util/accessability'
	import { circOut as easing } from 'svelte/easing'
	import PrismCodebox from '../prism/prismCodebox.svelte'

	export let page: string

	page = page.replace(
		/<a href="(.+?)">(.+?)<\/a>/gm,
		`<a class="animated-java-anchor" onclick="AnimatedJava.docClick('$1')">$2</a>`
	)
	page = page.replace(/<h([1-6])>(.+?)<\/h[1-6]>/gm, (match, p1, p2) => {
		return `<h${p1} id="${p2.toLowerCase().replace(' ', '_')}">${p2}</h${p1}>`
	})

	function replaceElements(node: HTMLElement) {
		const codeboxes = node.querySelectorAll('div[data-language]')

		for (const codebox of codeboxes) {
			const code = codebox.textContent!
			codebox.textContent = ''
			const language = codebox.getAttribute('data-language')!
			new PrismCodebox({
				target: codebox,
				props: { language, code },
			})
		}
	}
</script>

<div class="animated-java-doc-page" in:$fly={{ x: -20, duration: 250, easing }} use:replaceElements>
	{@html page}
</div>

{@html `<style>
.animated-java-doc-page img {
	border: 0.25em solid var(--color-dark);
	border-radius: 0.5em;
	image-rendering: auto;
	max-width: 660px;
}
.animated-java-doc-page h1 {
	display: flex;
	justify-content: center;
	text-align: center;
	font-size: 3em;
}
.animated-java-doc-page p {
	margin: 0.5em 1em;
}
.animated-java-doc-page a.animated-java-anchor {
	text-decoration: underline;
	cursor: pointer;
}
.animated-java-doc-page a.animated-java-anchor:hover {
	color: var(--color-accent);
}
.animated-java-doc-page ol,
.animated-java-doc-page ul {
	margin-left: 2em;
}
.animated-java-doc-page li {
	list-style: unset;
}
.animated-java-doc-page blockquote {
	border-left: 4px solid var(--color-accent);
	background-color: var(--color-button);
	padding-left: 1em;
}
.animated-java-doc-page code {
	background-color: var(--color-back);
	border: unset;
	user-select: text;
	font-family: var(--font-code);
	font-size: 0.85em;
	display: inline-flex;
	padding: 0em 0.5em;
	border-radius: 0.2em;
}
.animated-java-doc-page pre {
	background-color: var(--color-back);
	border: 2px solid var(--color-border);
	border-radius: 0.25em;
	margin: 0.5em 1em;
	padding: 0.25em 0.5em;
	overflow-x: auto;
}
.animated-java-doc-page pre div div {
	all: unset;
	font-size: 0.8em;
	font-family: var(--font-code);
	cursor: text;
	user-select: text;
}
.animated-java-doc-page pre code {
	all: unset;
	font-size: 0.8em;
	font-family: var(--font-code);
	cursor: text;
	user-select: text;
}
.animated-java-doc-page h2 {
	font-weight: unset;
}
.animated-java-doc-page h3 {
	margin: 0.2em 0.5em;
	text-decoration: underline;
}
</style>`}

<script lang="ts">
	import { fly } from '../../util/accessability'
	import { circOut as easing } from 'svelte/easing'
	import PrismCodebox from '../prism/prismCodebox.svelte'
	import { escape } from 'querystring'

	export let page: string

	page = page.replace(/<h([1-6])>(.+?)<\/h[1-6]>/gm, (match, p1, p2) => {
		return `<h${p1} id="${escape(p2.toLowerCase().replace(' ', '_'))}">${p2}</h${p1}>`
	})
	page = page.replace(
		/<a href="(.+?)">(.+?)<\/a>/gm,
		`<a class="animated-java-anchor" onclick="AnimatedJava.docClick('$1')">$2</a>`
	)

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
.animated-java-doc-page {
	display: flex;
	flex-direction: column;
	flex-grow: 1;
}
.animated-java-doc-page img {
	border: 0.25em solid var(--color-dark);
	border-radius: 0.5em;
	image-rendering: auto;
	max-width: 660px;
}
.animated-java-doc-page p {
	margin: 0.5em 1em;
}
.animated-java-doc-page p.image-container {
	display: flex;
	flex-direction: column;
	align-items: center;
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
	padding: 5px 0px;
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
	display: inline-table;
	white-space: pre-wrap;
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
.animated-java-doc-page h1 {
	display: flex;
	justify-content: center;
	align-items: center;
	text-align: center;
	font-size: 3em;
	flex-direction: column;
}
.animated-java-doc-page h1:after {
	content: '';
	width: 90%;
	height: 2px;
	background-color: var(--color-accent);
}
.animated-java-doc-page h2 {
	display: flex;
	justify-content: center;
	flex-direction: column;
	font-weight: unset;
	margin-bottom: 10px;
	align-items: center;
	padding: 20px 0px;
}
.animated-java-doc-page h2:after {
	content: '';
	width: 75%;
	height: 2px;
	background-color: var(--color-accent);
}
.animated-java-doc-page h3 {
	display: flex;
	justify-content: center;
	font-weight: unset;
	margin-bottom: 10px;
	align-items: flex-start;
	flex-direction: column;
	box-sizing: unset;
	font-size: 1.5em;
}
.animated-java-doc-page h6 {
	font-style: italic;
	opacity: 0.76;
	font-size: 0.9em;
}
.animated-java-doc-page h4 {
	display: flex;
	justify-content: center;
	font-weight: unset;
	margin: 10px 16px 0px;
	align-items: flex-start;
	flex-direction: column;
	box-sizing: unset;
	font-size: 20px;
}
</style>`}

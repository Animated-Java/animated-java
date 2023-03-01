<script lang="ts">
	import { fly } from 'svelte/transition'
	import { circOut as easing } from 'svelte/easing'

	export let page: string

	page = page.replace(
		/<a href="(.+?)">(.+?)<\/a>/gm,
		`<a class="animated-java-anchor" onclick="animated_java.docClick('$1')">$2</a>`
	)
	page = page.replace(/<h([1-6])>(.+?)<\/h[1-6]>/gm, (match, p1, p2) => {
		return `<h${p1} id="${p2.toLowerCase().replace(' ', '_')}">${p2}</h${p1}>`
	})
</script>

<div class="animated-java-doc-page" in:fly={{ x: -20, duration: 250, easing }}>{@html page}</div>

{@html `<style>
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

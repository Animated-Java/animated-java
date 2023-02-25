<script lang="ts">
	export let page: string

	page = page.replace(
		/<a href="(.+?)">(.+?)<\/a>/gm,
		`<a class="animated-java-anchor" onclick="ANIMATED_JAVA.docClick('$1')">$2</a>`
	)
	page = page.replace(/<h([1-6])>(.+?)<\/h[1-6]>/gm, (match, p1, p2) => {
		return `<h${p1} id="${p2.toLowerCase().replace(' ', '_')}">${p2}</h${p1}>`
	})
</script>

<div class="this">{@html page}</div>

{@html `<style>
.this h1 {
	display: flex;
	justify-content: center;
	text-align: center;
}
.this p {
	margin: 0.5em 0;
}
.this a.animated-java-anchor {
	text-decoration: underline;
}
.this a.animated-java-anchor:hover {
	color: var(--color-accent);
}
.this ol,
.this ul {
	margin-left: 1em;
}
.this li {
	list-style: unset;
}
.this blockquote {
	border-left: 4px solid var(--color-accent);
	background-color: var(--color-button);
	padding-left: 1em;
}
.this code {
	background-color: var(--color-back);
	border: 1px solid var(--color-border);
	user-select: text;
	font-family: var(--font-code);
	padding: 0.04em 0.2em;
	border-radius: 0.25em;
}
.this pre {
	background-color: var(--color-back);
	border: 2px solid var(--color-border);
	border-radius: 0.5em;
	padding: 1em;
	padding-top: 0.5em;
	padding-bottom: 0.5em;
}
.this pre code {
	all: unset;
	font-size: 0.8em;
	font-family: var(--font-code);
	cursor: text;
	user-select: text;
}
.this h2 {
	font-weight: unset;
}
.this h3 {
	margin: 0.2em 1em;
}
</style>`}

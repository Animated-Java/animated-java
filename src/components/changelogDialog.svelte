<script lang="ts">
	import changelog from '../pluginPackage/changelog.json'
	import AnimatedJavaIcon from '../assets/animated_java_icon.svg'

	function formatDateFull(date: string) {
		// @ts-expect-error
		return getDateDisplay(date).full
	}
	function formatDateShort(date: string) {
		// @ts-expect-error
		return getDateDisplay(date).short
	}

	const ISSUES_URL = 'https://api.github.com/repos/animated-java/animated-java/issues/'

	async function formatMarkdown(text: string) {
		const issues: Record<number, { title: string; url: string }> = {}
		text = text.replace('[BREAKING]', '<span class="breaking">BREAKING</span>')
		text = text.replace(/\[([^\]]+?)\]\(([^)]+?)\)/gm, (match, title, url) => {
			const issueMatch = url.match(/issues\/(\d+)/)
			if (issueMatch) {
				const issueNumber = parseInt(issueMatch[1])
				issues[issueNumber] = { title, url }
				return `$$$ISSUE${issueNumber}$$$`
			}
			return `<a href="${url}" target="_blank">${title}</a>`
		})
		for (const [issueNumber, { title, url }] of Object.entries(issues)) {
			await fetch(`${ISSUES_URL}${issueNumber}`)
				.then(response => response.json())
				.then(data => {
					text = text.replace(
						`$$$ISSUE${issueNumber}$$$`,
						`<a href="${url}" target="_blank">#${issueNumber} - ${data.title}</a>`,
					)
				})
		}
		// inline code blocks
		text = text.replace(/`([^`]+?)`/g, '<code>$1</code>')
		return text
	}
</script>

<div class="content plugin_browser_tabbed_page" id="plugin_browser_changelog">
	{#each Object.values(changelog).reverse() as versions}
		<div class="title-container">
			<img src={AnimatedJavaIcon} alt="" />
			<h3>
				{versions.title}
			</h3>
		</div>
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label class="plugin_changelog_author">{versions.author}</label>
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label class="plugin_changelog_date" title={formatDateFull(versions.date)}>
			<i class="material-icons icon">calendar_today</i>
			<!-- svelte-ignore missing-declaration -->
			{formatDateShort(versions.date)}
		</label>
		<ul>
			{#each versions.categories as category}
				<li>
					<h4>{category.title}</h4>
					<ul class="plugin_changelog_features">
						{#each category.list as item}
							<li>
								{#await formatMarkdown(item) then data}
									{@html data}
								{/await}
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
		<hr />
	{/each}
</div>

<style>
	.content {
		max-height: 75vh;
		overflow: auto;
	}
	:global(.plugin_browser_tabbed_page code) {
		background-color: var(--color-back);
		padding: 0.2em 0.4em;
		border-radius: 3px;
		font-size: 0.8em;
	}
	:global(.plugin_browser_tabbed_page .breaking) {
		background-color: var(--color-error);
		color: var(--color-back);
		padding: 0 0.3em;
		border-radius: 3px;
		font-size: 0.8em;
		font-weight: 700;
	}
	img {
		border-radius: 4px;
		width: 24px;
		height: 24px;
		margin-left: 0.5px;
		box-shadow: 1px 1px 1px #000000aa;
	}
	.title-container h3 {
		margin-left: 8px;
		margin-top: 0;
	}
	.title-container {
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		align-items: center;
		margin-top: 8px;
	}
</style>

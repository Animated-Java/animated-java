<script lang="ts" context="module">
	import AnimatedJavaIcon from '../assets/animated_java_icon.svg'
	import changelog from '../pluginPackage/changelog.json'

	const ISSUES_URL = 'https://api.github.com/repos/animated-java/animated-java/issues/'

	const formatDateFull = (date: string) => {
		// @ts-expect-error No types for getDateDisplay
		return getDateDisplay(date).full
	}
	const formatDateShort = (date: string) => {
		// @ts-expect-error No types for getDateDisplay
		return getDateDisplay(date).short
	}

	interface GithubIssue {
		number: number
		title: string
		html_url: string
	}

	const ISSUES = new Map<string, GithubIssue>()

	const fetchIssue = async (issueId: string): Promise<GithubIssue | undefined> => {
		if (ISSUES.has(issueId)) return ISSUES.get(issueId)

		const issue = await fetch(ISSUES_URL + issueId)
			.then(async response => {
				const json = await response.json()
				if (!response.ok)
					throw new Error(
						`Failed to fetch issue ${issueId}: ` + (json.message ?? response.statusText)
					)
				return json
			})
			.catch(e => {
				console.error(`Failed to fetch issue ${issueId}`, e)
				return undefined
			})
		if (issue) ISSUES.set(issueId, issue)
		return issue
	}
</script>

<div class="content plugin_browser_tabbed_page" id="plugin_browser_changelog">
	{#each Object.values(changelog).reverse().slice(0, 4) as versions}
		<div class="title-container">
			<img src={AnimatedJavaIcon} alt="" />
			<h3>
				{'Animated Java ' + versions.title}
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
					<h4>
						{category.title}
					</h4>
					<ul class="plugin_changelog_features">
						{#each category.list as item}
							{@const issueMatch = /^Fixed \[#(\d+)\]\(.+?\)$/.exec(item)}
							{#if issueMatch}
								{#await fetchIssue(issueMatch[1])}
									<li>
										<p>
											<i class="material-icons icon spinner"
												>progress_activity</i
											>
											<!-- svelte-ignore missing-declaration -->
											{@html pureMarked(item)}
										</p>
									</li>
								{:then issue}
									<li>
										<p>
											{'Fixed '}
											{#if issue}
												<a href={issue.html_url} target="_blank">
													{'#' + issue.number}
												</a>
												{' - '}
												<!-- svelte-ignore missing-declaration -->
												{@html pureMarked(issue.title)}
											{:else}
												<a
													href="${ISSUES_URL + issueMatch[1]}"
													target="_blank"
												>
													{'#' + issueMatch[1]}
												</a>
											{/if}
										</p>
									</li>
								{:catch}
									<li>
										<!-- svelte-ignore missing-declaration -->
										{@html pureMarked(item)}
									</li>
								{/await}
							{:else if item.startsWith('[BREAKING]')}
								<li>
									<p>
										<span class="breaking">BREAKING</span>
										<!-- svelte-ignore missing-declaration -->
										{@html pureMarked(item.replace('[BREAKING]', '').trim())}
									</p>
								</li>
							{:else}
								<li>
									<!-- svelte-ignore missing-declaration -->
									{@html pureMarked(item)}
								</li>
							{/if}
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
		<hr />
	{/each}
	<p class="disclaimer">To see the full changelog, open Animated Java in the plugin list.</p>
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
		font-size: 0.9em;
		font-weight: bold;
		height: min-content;
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
	hr {
		margin: 2rem 0;
	}
	.disclaimer {
		font-size: 0.9em;
		color: var(--color-text-secondary);
		font-style: italic;
		text-align: center;
		margin-top: 1rem;
	}
	li > p {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
		align-items: flex-start;
	}
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	.spinner {
		animation: spin 1s linear infinite;
	}
</style>

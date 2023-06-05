<script lang="ts" context="module">
	// @ts-ignore
	import kofiImage from '../../assets/kofi_button_blue.webp'
	// @ts-ignore
	import logo from '../../assets/animated_java_icon.svg'
	// @ts-ignore
	import snavesutitImage from '../../assets/YokaiS Snave.webp'
	// @ts-ignore
	import fetchbotImage from '../../assets/YokaiS FetchBot.webp'
	// @ts-ignore
	import dominexisImage from '../../assets/Dominexis.webp'
	// @ts-ignore
	import patreonImage from '../../assets/Digital-Patreon-Wordmark_Black.webp'
	import PACKAGE from '../../../package.json'
</script>

<div class="container">
	<div style="display: flex; flex-direction: row; margin-bottom: 10px">
		<img
			src={logo}
			alt="Animated Java Logo"
			style="width: 128px; border-radius: 10px; margin-right: 20px;"
		/>
		<div style="display: flex; flex-direction: column; justify-content: center;">
			<h1 style="margin-bottom: 0px; font-size: 40px;">{PACKAGE.title}</h1>
			<div style="display: flex; align-items: center; justify-content: flex-start;">
				<p style="margin: 0px;">v{PACKAGE.version}-{process.env.FLAVOR}</p>
				<a href="https://github.com/Animated-Java/animated-java">
					<i class="fa-brands fa-github" style="margin-left: 10px; font-size: 25px;" />
				</a>
			</div>
		</div>
	</div>
	<p>{PACKAGE.description}</p>
	<h2 style="padding-top: 16px;">Created by</h2>
	<br />
	<div class="profile-image-container">
		<img
			class="profile-image"
			src={snavesutitImage}
			alt="SnaveSutit's Profile"
			style="width: 100px;"
		/>
		<p>{PACKAGE.author.name}</p>
		<p>{PACKAGE.author.email}</p>
		<a class="kofi-button" href="https://ko-fi.com/snavesutit">
			<img src={kofiImage} alt="Ko-fi logo" style="width: 176px;" />
		</a>
	</div>
	<h2 style="margin: 10px 0px;">With AMAZING help from</h2>
	<div class="side-by-side-images">
		<div class="profile-image-container">
			<img class="profile-image" src={fetchbotImage} alt="FetchBot's Profile" />
			<p>{PACKAGE.contributors[0].name}</p>
			<p>{PACKAGE.contributors[0].email}</p>
		</div>
		<div style="display: flex; align-items: center;">
			<p>and</p>
		</div>
		<div class="profile-image-container">
			<img class="profile-image" src={dominexisImage} alt="Dominexis' Profile" />
			<p>{PACKAGE.contributors[1].name}</p>
			<p>{PACKAGE.contributors[1].email}</p>
			<a href="https://www.patreon.com/Dominexis">
				<img class="patreon-button" src={patreonImage} alt="Patreon Button" />
			</a>
		</div>
	</div>
	<br />
	<h2 style="text-align: center;">
		Super Special Thank You for Your Help Supporting This Project's Development!
	</h2>
	<div class="name-grid supporter-name-grid">
		<!-- Active supporters go below this line -->
		<p class="active-supporter">Boxic</p>
		<p class="active-supporter">Flubberschnub</p>
		<p class="active-supporter">HaxOR359</p>
		<p class="active-supporter">MrMakistein</p>
		<p class="active-supporter">alumina6767</p>
		<p class="active-supporter">Serahs</p>
		<p class="active-supporter">Cinnamon Studios</p>
		<p class="active-supporter">MarcoStrk</p>
		<p class="active-supporter">VonLeipenstein</p>
		<!-- Inactive/old supporters go below this line -->
		<p class="inactive-supporter">CubeDeveloper</p>
		<p class="inactive-supporter">DoubleFelix</p>
		<p class="inactive-supporter">__SK__</p>
	</div>
	<br />
	<h3>Thank You to Our Early Adopters and Contributors!</h3>
	<div class="name-grid">
		{#each PACKAGE.special_thanks as name}
			<p>{name}</p>
		{/each}
	</div>
	<br />
	<p><i>Animated Java is unaffiliated with Mojang Studios or Minecraft</i></p>
</div>

<style>
	img {
		image-rendering: auto;
	}
	.active-supporter {
		opacity: 1;
	}
	.inactive-supporter {
		opacity: 0.75;
	}
	.name-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-column-gap: 10px;
		justify-items: center;
	}
	.supporter-name-grid > p {
		font-size: 20px;
	}
	.name-grid > p {
		background-color: var(--color-back);
		padding: 2px 10px;
		border-bottom: 4px solid var(--color-dark);
		width: 100%;
		text-align: center;
		border-radius: 10px;
		padding-top: 3px;
	}
	h2 {
		font-weight: normal;
	}
	.profile-image-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		margin: 0px 10px;
		border-radius: 10px;
		background-color: var(--color-back);
		padding: 10px 10px 0px 10px;
		border-radius: 10px;
		border-bottom: 4px solid var(--color-dark);
	}
	.profile-image-container > p {
		margin: 0px;
	}
	.profile-image-container p:last-of-type {
		margin-bottom: 2px;
	}
	.profile-image {
		width: 64px;
		border-radius: 64px;
		margin-bottom: 10px;
	}
	.side-by-side-images {
		display: flex;
		flex-direction: row;
		align-items: stretch;
	}
	.kofi-button {
		transform: scale(1);
		transition: transform 0.1s ease-in-out;
	}
	.kofi-button:hover {
		transform: scale(1.1);
	}
	.patreon-button {
		background-color: #ff424d;
		border-radius: 5px;
		padding: 0.2em 2em;
		width: 165px;
		transform: scale(1);
		transition: transform 0.1s ease-in-out;
	}
	.patreon-button:hover {
		transform: scale(1.1);
	}
	div.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow-y: auto;
		max-height: 800px;
	}
</style>

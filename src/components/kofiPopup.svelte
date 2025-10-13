<script lang="ts" context="module">
	import HeartIcon from '../assets/heart.png'
	import KoFiImage from '../assets/kofi_tag_white.webp'

	localStorage.setItem('animated_java_settings_support_me_popup', 'true')
</script>

<script lang="ts">
	let showSupportMePopup =
		localStorage.getItem('animated_java_settings_support_me_popup') === 'true'

	const clickSupportMeXButton = () => {
		localStorage.setItem('animated_java_settings_support_me_popup', 'false')
		showSupportMePopup = false
	}

	const hoverCloseButton = (e: MouseEvent) => {
		if (!(e.target instanceof HTMLElement)) return
		e.target.textContent = 'sentiment_sad'
	}

	const leaveCloseButton = (e: MouseEvent) => {
		if (!(e.target instanceof HTMLElement)) return
		e.target.textContent = 'close'
	}
</script>

{#if showSupportMePopup}
	<div class="ko-fi-popup-container">
		<div class="ko-fi-popup">
			<div class="title">
				<img class="heart" src={HeartIcon} alt="❤️" />
				<span>Animated Java?</span>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<i
					class="material-icons icon"
					on:click={clickSupportMeXButton}
					on:mouseenter={hoverCloseButton}
					on:mouseleave={leaveCloseButton}
				>
					close
				</i>
			</div>
			<a href="https://ko-fi.com/snavesutit" class="ko-fi-button">
				<img src={KoFiImage} alt="" />
			</a>
		</div>
	</div>
{/if}

<style>
	i {
		cursor: pointer;
		height: fit-content;
		transition:
			transform 0.2s ease 0s,
			color 0.2s ease 0s;
		text-shadow: 1.5px 1.5px 0px rgba(0, 0, 0, 0.25);
		align-self: flex-start;
	}
	i:hover {
		transform: scale(1.25);
	}

	.ko-fi-popup-container {
		position: absolute;
		top: 30px;
		left: 100%;
		font-family: 'MinecraftFull';
		font-size: 24px;
		color: white;
		overflow: hidden;
	}
	.ko-fi-popup {
		position: relative;
		padding: 10px 12px;

		background-color: #00aced;
		border-radius: 0 8px 8px 0;
		animation: slideIn 1.5s;
		line-height: 1;
	}
	.heart {
		width: 28px;
		height: 28px;
		animation: heartbeat 2s ease infinite;
	}
	@keyframes heartbeat {
		0% {
			transform: scale(1);
		}
		10% {
			transform: scale(1.2);
		}
		20% {
			transform: scale(1);
		}
	}
	.ko-fi-popup span {
		text-shadow: 0.2rem 0.2rem 0px rgba(0, 0, 0, 0.25);
	}
	.ko-fi-button img {
		width: 100%;
		image-rendering: auto;
		transition: transform 0.2s ease;
	}
	.ko-fi-button img:hover {
		transform: scale(1.05);
	}
	.ko-fi-popup .title {
		display: flex;
		align-items: center;
		gap: 1rem;
		white-space: nowrap;
		margin-bottom: 8px;
	}
	@keyframes slideIn {
		0% {
			right: 100%;
		}
		50% {
			right: 100%;
		}
		100% {
			right: 0;
		}
	}
</style>

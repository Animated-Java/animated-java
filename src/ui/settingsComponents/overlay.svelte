<script lang="ts">
	// Credit: https://github.com/wysher/svelte-overlay/blob/master/src/components/Overlay.svelte
	const RIGHT = 'right'
	const LEFT = 'left'
	const TOP = 'top'
	const CENTER = 'center'
	const BOTTOM = 'bottom'

	type IPositions =
		| 'bottom-right'
		| 'bottom-center'
		| 'bottom-left'
		| 'top-right'
		| 'top-center'
		| 'top-left'
		| 'right-bottom'
		| 'right-center'
		| 'right-top'
		| 'left-bottom'
		| 'left-center'
		| 'left-top'

	interface $$Props {
		isOpen?: boolean
		updateOnScroll?: boolean
		closeOnScroll?: boolean
		position?: IPositions
		closeOnClickOutside?: boolean
		zIndex?: number
		onWindowKeyDown?: () => void
		style?: string
	}

	interface customDOMRect extends DOMRect {
		clientWidth: number
		clientHeight: number
	}

	import { beforeUpdate, onMount, onDestroy, tick, createEventDispatcher } from 'svelte'
	function getNextPosition(position: IPositions, dimensions: any) {
		const clientHeight = Math.min(
			document.body.clientHeight,
			document.documentElement.clientHeight
		)
		const clientWidth = Math.min(
			document.body.clientWidth,
			document.documentElement.clientWidth
		)
		Object.assign(dimensions, { clientWidth, clientHeight })

		const [mainPosition, secondaryPosition] = position.split('-')
		const nextMainPosition = getMainPosition(mainPosition, dimensions)
		const nextSecondaryPosition = getSecondaryPosition(secondaryPosition, dimensions)

		return `${nextMainPosition}-${nextSecondaryPosition}`
	}

	const getMainPosition = (
		position: string,
		{ top, bottom, left, right, height, width, clientWidth, clientHeight }: customDOMRect
	) => {
		const fitsOnTop = top > height
		const fitsOnBottom = bottom + height < clientHeight

		const fitsOnLeft = left > width
		const fitsOnRight = right + width < clientWidth

		const positions: any = {
			top: () => (!fitsOnTop && fitsOnBottom ? BOTTOM : TOP),
			bottom: () => (fitsOnTop && !fitsOnBottom ? TOP : BOTTOM),
			left: () => (!fitsOnLeft && fitsOnRight ? RIGHT : LEFT),
			right: () => (!fitsOnRight && fitsOnLeft ? LEFT : RIGHT),
		}

		return positions[position]()
	}

	const getSecondaryPosition = (
		position: string,
		{ top, bottom, left, right, height, width, clientWidth, clientHeight }: customDOMRect
	) => {
		const parentHeight = bottom - top
		const parentCenter = top + parentHeight / 2

		const fitsOnTop = bottom > height
		const fitsOnBottom = top + height < clientHeight
		const fitsCenter = parentCenter - height / 2 > 0 && parentCenter + height / 2 < clientHeight
		const fitsOnLeft = right > width
		const fitsOnRight = left + width < clientWidth

		const positions: any = {
			top: () => (!fitsOnTop && fitsOnBottom ? BOTTOM : TOP),
			center: () => (fitsCenter ? CENTER : positions.top()),
			bottom: () => (!fitsOnBottom && fitsOnTop ? TOP : BOTTOM),
			left: () => (!fitsOnLeft && fitsOnRight ? RIGHT : LEFT),
			right: () => (!fitsOnRight && fitsOnLeft ? LEFT : RIGHT),
		}

		return positions[position]()
	}

	const dispatch = createEventDispatcher()

	export let isOpen = false
	export let updateOnScroll = false
	export let closeOnScroll = false
	export let position: IPositions = 'bottom-right'
	export let closeOnClickOutside = false
	export let zIndex = 1
	export let onWindowKeyDown = () => {}
	export let style = ''

	$: className = $$restProps['class'] || ''

	let currentPosition: any = position
	let parent: any
	let content: any
	let target

	let topStyle = 0
	let leftStyle = 0
	let widthStyle = 0
	let heightStyle = 0

	$: hasParent = !parent || !!parent.childNodes.length
	$: hasContent = !content || !!content.childNodes.length

	$: if (!hasParent) throw new Error('parent slot is required')
	$: if (!hasContent) throw new Error('content slot is required')

	$: openedState = isOpen && hasParent && hasContent

	function addListeners() {
		window.addEventListener('resize', updatePosition)
		if (closeOnScroll) window.addEventListener('scroll', close)
		else if (updateOnScroll) window.addEventListener('scroll', updatePosition)
	}

	function removeListeners() {
		window.removeEventListener('resize', updatePosition)
		window.removeEventListener('scroll', updatePosition)
		window.removeEventListener('scroll', close)
	}

	onMount(() => {
		if (openedState) {
			addListeners()
		}
	})

	onDestroy(() => {
		removeListeners()
	})

	beforeUpdate(updatePosition)

	function toggle(value: boolean) {
		const prevOpen = isOpen
		const nextOpen = value === true || value === false ? value : !isOpen

		if ((nextOpen && hasParent && hasContent) || !nextOpen) isOpen = nextOpen

		if (prevOpen !== isOpen) {
			dispatch('toggle', isOpen)
			if (isOpen) {
				addListeners()
				dispatch('open')
			} else {
				dispatch('close')
				removeListeners()
			}
		}
	}

	function open() {
		if (!openedState) toggle(true)
	}

	function close() {
		if (openedState) toggle(false)
	}

	function contains(event: any) {
		const path = event.path || event.composedPath()
		return path.includes(parent) || path.includes(content)
	}

	function handleWindowClick(event: any) {
		if (!closeOnClickOutside || !openedState || contains(event)) return
		close()
	}

	function handleWindowKeyDown(event: any) {
		if (!onWindowKeyDown || !openedState) return
		// @ts-ignore
		onWindowKeyDown(event, { isOpen: openedState, open, close, toggle, contains })
	}

	async function updatePosition() {
		await tick()
		if (!openedState) return

		const {
			top,
			bottom,
			left,
			right,
			width: parentWidth,
			height: parentHeight,
		} = parent.getBoundingClientRect()
		const { height, width } = content.getBoundingClientRect()

		const dimensions = { top, bottom, left, right, height, width }
		const nextPosition = getNextPosition(position, dimensions)

		if (currentPosition !== nextPosition) {
			currentPosition = nextPosition
		}

		topStyle = top
		leftStyle = left
		widthStyle = parentWidth
		heightStyle = parentHeight
	}
</script>

<svelte:window on:mousedown={handleWindowClick} on:keydown={handleWindowKeyDown} />

<div bind:this={target} class={`overlay ${className}`} style={`z-index:${zIndex}; ${style}`}>
	<div bind:this={parent}>
		<slot name="parent" {toggle} isOpen={openedState} {open} {close} />
	</div>
	<div
		class="content-wrapper"
		style={`top: ${topStyle}px; left: ${leftStyle}px; width: ${widthStyle}px; height: ${heightStyle}px; z-index:${100};`}
	>
		{#if openedState}
			<div class={`content ${currentPosition || ''}`} bind:this={content}>
				<slot name="content" {toggle} isOpen={openedState} {open} {close} />
			</div>
		{/if}
	</div>
</div>

<style>
	.overlay {
		position: relative;
		display: inline-block;
		box-sizing: border-box;
	}

	.content-wrapper {
		/* position: fixed; */
		pointer-events: none;
		width: max-content;
	}

	.content-wrapper > * {
		pointer-events: all;
	}

	.content {
		position: absolute;
		min-width: 100%;
	}

	.top-left,
	.top-center,
	.top-right {
		bottom: 100%;
	}

	.bottom-left,
	.bottom-center,
	.bottom-right {
		top: 100%;
	}

	.top-left,
	.bottom-left {
		right: 0;
	}

	.top-center,
	.bottom-center {
		left: 50%;
		transform: translateX(-50%);
	}

	.top-right,
	.bottom-right {
		left: 0;
	}

	.left-top,
	.left-bottom,
	.left-center {
		right: 100%;
	}

	.right-top,
	.right-bottom,
	.right-center {
		left: 100%;
	}

	.left-center,
	.right-center {
		top: 50%;
		transform: translateY(-50%);
	}

	.left-top,
	.right-top {
		bottom: 0;
	}

	.left-bottom,
	.right-bottom {
		top: 0;
	}
</style>

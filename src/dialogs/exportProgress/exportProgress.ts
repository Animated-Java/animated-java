import { observable } from 'svelte-observable-store'
import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import { localize as translate } from '../../util/lang'
import ExportProgressDialogSvelteComponent from './exportProgress.svelte'

/** Primary phase label, e.g. "Rendering Animations..." */
export const PROGRESS_DESCRIPTION = observable('')
/** Primary progress bar. Hidden while {@link PROGRESS} is 0. */
export const PROGRESS = observable(0)
export const MAX_PROGRESS = observable(1)
/** Secondary line under the phase label, e.g. the current animation or file name. */
export const PROGRESS_DETAIL = observable('')
/** Secondary progress bar. Hidden while {@link SUB_MAX_PROGRESS} is 0. */
export const SUB_PROGRESS = observable(0)
export const SUB_MAX_PROGRESS = observable(0)

/**
 * Starts a new export phase: sets the primary label and resets both progress
 * bars and the detail line. Pass `maxProgress` to show the primary bar.
 */
export function setExportProgressPhase(description: string, maxProgress = 1) {
	PROGRESS_DESCRIPTION.set(description)
	PROGRESS_DETAIL.set('')
	PROGRESS.set(0)
	MAX_PROGRESS.set(maxProgress)
	SUB_PROGRESS.set(0)
	SUB_MAX_PROGRESS.set(0)
}

/** Sets up the secondary progress bar for a sub-task of the current phase. */
export function setExportProgressSubTask(detail: string, subMaxProgress = 0) {
	PROGRESS_DETAIL.set(detail)
	SUB_PROGRESS.set(0)
	SUB_MAX_PROGRESS.set(subMaxProgress)
}

let realClose: ((button?: number, event?: Event) => void) | undefined
let previewTimer: ReturnType<typeof setInterval> | undefined

function stopPreview() {
	if (previewTimer !== undefined) {
		clearInterval(previewTimer)
		previewTimer = undefined
	}
}

function createDialog(closeable: boolean, onClose?: () => void) {
	closeExportProgressDialog()

	const dialog = new SvelteDialog({
		id: `${PACKAGE.name}:exportProgressDialog`,
		title: translate('dialog.export_progress.title'),
		width: 512,
		component: ExportProgressDialogSvelteComponent,
		props: {
			progress: PROGRESS,
			maxProgress: MAX_PROGRESS,
			progressDescription: PROGRESS_DESCRIPTION,
			progressDetail: PROGRESS_DETAIL,
			subProgress: SUB_PROGRESS,
			subMaxProgress: SUB_MAX_PROGRESS,
		},
		disableKeybinds: true,
		cancel_on_click_outside: false,
		buttons: [],
		onClose,
	}).show()

	realClose = dialog.close.bind(dialog)
	if (!closeable) {
		// Blocks all interaction with Blockbench, so the user cannot
		// dismiss the dialog. Every user-facing close path (the
		// title-bar X, Escape, backdrop clicks) routes through
		// `Dialog.prototype.close`, so shadow it with a no-op and keep a private
		// reference for `closeExportProgressDialog` to use once the export is done.
		dialog.close = () => {
			/* Blocked: only closeExportProgressDialog() may dismiss this dialog. */
		}
		dialog.object?.querySelector('.dialog_close_button')?.remove()
	}

	return dialog
}

export function openExportProgressDialog() {
	setExportProgressPhase('Preparing...')
	return createDialog(false)
}

/** Closes the export progress dialog. This is the only way it can be dismissed. */
export function closeExportProgressDialog() {
	stopPreview()
	realClose?.(0)
	realClose = undefined
}

interface PreviewPhase {
	label: string
	/** Primary bar total. Omit for a label-only phase. */
	total?: number
	/** Detail line for primary step `i` (0-indexed). */
	detail?: (i: number) => string
	/** Secondary bar total for primary step `i`. */
	subTotal?: (i: number) => number
}

/** Ticks a label-only preview phase lingers before advancing (~33ms each). */
const PREVIEW_HOLD_TICKS = 40
const PREVIEW_ANIMATIONS = ['idle', 'walk', 'run', 'wave', 'attack', 'death']
const PREVIEW_FILES = [
	'summon.mcfunction',
	'on_load.mcfunction',
	'animations/walk/zzz/frames/12.mcfunction',
	'apply_default_pose.mcfunction',
	'remove/this.mcfunction',
	'variants/red/apply.mcfunction',
	'animations/idle/tween.mcfunction',
	'zzz/summon/as_root_entity.mcfunction',
]

const PREVIEW_PHASES: PreviewPhase[] = [
	{ label: 'Preparing...' },
	{ label: 'Rendering Rig...' },
	{
		label: 'Rendering Animations...',
		total: PREVIEW_ANIMATIONS.length,
		detail: i => PREVIEW_ANIMATIONS[i],
		subTotal: i => 20 + i * 15,
	},
	{ label: 'Hashing Rendered Objects...' },
	{
		label: 'Creating Animation Storage...',
		total: PREVIEW_ANIMATIONS.length,
		detail: i => PREVIEW_ANIMATIONS[i],
		subTotal: i => 20 + i * 15,
	},
	{
		label: 'Writing Data Pack...',
		total: 60,
		detail: i => PREVIEW_FILES[i % PREVIEW_FILES.length],
	},
	{
		label: 'Merging Function Tags...',
		total: 8,
		detail: i =>
			`tags/function/${PREVIEW_FILES[i % PREVIEW_FILES.length].replace(/\.mcfunction$/, '.json')}`,
	},
	{ label: 'Compiling Resource Pack...' },
	{
		label: 'Writing Resource Pack...',
		total: 40,
		detail: i => PREVIEW_FILES[i % PREVIEW_FILES.length].replace('.mcfunction', '.json'),
	},
]

/**
 * Opens the export progress dialog in a closeable preview that loops through
 * every phase and bar/detail combination with dummy values, so the dialog can
 * be eyeballed without running a real export. Exposed on the `AnimatedJava`
 * global; close the dialog (X / Escape) to stop it.
 */
export function debugExportProgressDialog() {
	setExportProgressPhase('Preparing...')
	createDialog(true, stopPreview)

	let phase = 0
	let step = 0
	let sub = 0
	let hold = 0

	previewTimer = setInterval(() => {
		const p = PREVIEW_PHASES[phase]

		if (p.total === undefined) {
			PROGRESS_DESCRIPTION.set(p.label)
			PROGRESS_DETAIL.set('')
			PROGRESS.set(0)
			SUB_MAX_PROGRESS.set(0)
			if (++hold >= PREVIEW_HOLD_TICKS) {
				hold = 0
				phase = (phase + 1) % PREVIEW_PHASES.length
			}
			return
		}

		PROGRESS_DESCRIPTION.set(p.label)
		MAX_PROGRESS.set(p.total)
		PROGRESS.set(step + 1)
		PROGRESS_DETAIL.set(p.detail ? p.detail(step) : '')

		const subMax = p.subTotal ? p.subTotal(step) : 0
		SUB_MAX_PROGRESS.set(subMax)
		if (subMax > 0) {
			sub += Math.max(1, Math.round(subMax / 25))
			SUB_PROGRESS.set(Math.min(sub, subMax))
			if (sub < subMax) return
			sub = 0
		}

		if (++step >= p.total) {
			step = 0
			phase = (phase + 1) % PREVIEW_PHASES.length
		}
	}, 33)
}

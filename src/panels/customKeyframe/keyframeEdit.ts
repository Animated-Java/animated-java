/**
 * Applies `edit` to `keyframe` as one undo step, which also marks the project as unsaved.
 */
export function editKeyframe(keyframe: _Keyframe, edit: () => void) {
	Undo.initEdit({ keyframes: [keyframe] })
	edit()
	Undo.finishEdit('Edit keyframe')
	Animator.preview()
}

function snapshot(keyframe: _Keyframe) {
	return JSON.stringify(keyframe.getUndoCopy())
}

/**
 * Svelte action for a keyframe's typed fields: like Blockbench's own keyframe inputs, everything
 * changed while focus stays inside `node` is one undo step.
 */
export function keyframeTextEdit(node: HTMLElement, keyframe: _Keyframe) {
	let before: string | undefined

	function finish() {
		if (before === undefined) return
		if (snapshot(keyframe) !== before) {
			Undo.finishEdit('Edit keyframe')
		} else {
			Undo.cancelEdit()
		}
		before = undefined
	}

	function onFocusIn() {
		if (before !== undefined) return
		before = snapshot(keyframe)
		Undo.initEdit({ keyframes: [keyframe] })
	}

	function onFocusOut(event: FocusEvent) {
		if (node.contains(event.relatedTarget as Node | null)) return
		// Let the field's change reach the keyframe before comparing.
		queueMicrotask(finish)
	}

	node.addEventListener('focusin', onFocusIn)
	node.addEventListener('focusout', onFocusOut)
	return {
		destroy() {
			node.removeEventListener('focusin', onFocusIn)
			node.removeEventListener('focusout', onFocusOut)
			// The panel can be swapped out while a field still has focus.
			finish()
		},
	}
}

/**
 * `beforeinput` handler that inserts native line breaks into a CodeJar editor as `\n` text.
 *
 * Chromium 150+ (Blockbench 5.2+) inserts `<br>` on Enter, even in `plaintext-only` `<pre>`
 * editors, and CodeJar reads its value from `textContent`, which drops `<br>`.
 */
export function insertLineBreakAsText(event: InputEvent) {
	if (event.inputType !== 'insertLineBreak' && event.inputType !== 'insertParagraph') return
	const selection = getSelection()
	if (!(event.target instanceof HTMLElement) || !selection?.rangeCount) return

	const afterCursor = document.createRange()
	afterCursor.selectNodeContents(event.target)
	const { endContainer, endOffset } = selection.getRangeAt(0)
	afterCursor.setStart(endContainer, endOffset)

	event.preventDefault()
	// A trailing `\n` doesn't render as a new line in a <pre>, so pad it with a second one.
	// The caret lands between them, since the browser can't place it after a trailing `\n`.
	document.execCommand('insertHTML', false, afterCursor.toString() === '' ? '\n\n' : '\n')
}

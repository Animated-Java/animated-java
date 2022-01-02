import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
const useOld = false
export function Dialog({ children, onRequestHide, title, width, height }) {
	if (!useOld) {
		const [dialog, setDialog] = useState(null)
		const [DialogUUID] = useState(Math.random().toString(16).substring(2))
		function hide() {
			onRequestHide()
		}
		useEffect(() => {
			let dialog = new window.Dialog(DialogUUID, {
				id: DialogUUID,
				// width: (width ? width : 'unset') + ';--a:1',
				height,
				title,
				lines: [`<div id="${DialogUUID}_mount"></div>`],
				onCancel() {
					hide()
				},
				buttons: [],
			})
			dialog.show()
			setDialog(dialog)
			return () => {
				dialog.hide()
			}
		}, [])

		return (
			dialog &&
			ReactDOM.createPortal(
				children,
				document.getElementById(`${DialogUUID}_mount`)
			)
		)
	} else {
		function hide() {
			onRequestHide()
		}
		const ref = useRef()
		useEffect(() => {
			if (ref.current) {
				let o = $(ref.current)
				o.draggable({
					handle: '.dialog_handle',
					containment: '#page_wrapper',
				})
				o.css('position', 'absolute')
			}
		}, [ref])
		return (
			<>
				<div
					style={{
						height: 'calc(100% - 26px)',
						width: '100%',
						zIndex: 10000,
						position: 'absolute',
						left: '0px',
						top: '26px',
					}}
					onClick={hide}
				></div>
				<dialog
					ref={ref}
					className="dialog paddinged ui-resizable ui-draggable draggable"
					style={{
						display: 'block',
						left: '0%',
						top: '128px',
						maxHeight: '50%',
						zIndex: 10001,
					}}
				>
					<div
						className="dialog_handle tl ui-draggable-handle"
						style={{ cursor: 'default' }}
					>
						{tl('panel.varients.dialog.name')}
						<div
							className="dialog_close_button"
							style={{ top: '0', right: '0' }}
							onClick={hide}
						>
							<i className="material-icons">clear</i>
						</div>
					</div>
					<div className="tab_content">{children}</div>
				</dialog>
			</>
		)
	}
}

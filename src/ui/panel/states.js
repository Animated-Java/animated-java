import React, { useRef, useEffect, useState } from 'react'
import ReactDom from 'react-dom'
import events, { LIFECYCLE } from '../../constants/events'
import { intl, tl } from '../../util/intl'
import { store } from '../../util/store'
import { bus } from '../../util/bus'
import { format } from '../../modelFormat'
import Dropdown from 'react-dropdown/dist/index'
import transparent from '../../assets/transparent.png'
import css from '../../dependencies/react-dropdown/style.css'

const style = document.createElement('style')
fetch(css)
	.then((res) => res.text())
	.then((str) => (style.innerHTML = str))
document.head.appendChild(style)
bus.on(events.LIFECYCLE.UNLOAD, () => {
	style.remove()
})

Interface.Panels.aj_states = new Panel({
	id: 'states',
	icon: 'movie',
	condition: { modes: ['edit'], formats: [format.id] },
	component: {
		name: 'panel-aj-variant',
		template: `<div id="java-animator-states"></div>`,
	},
})
bus.on(events.LIFECYCLE.CLEANUP, () => {
	Interface.Panels?.aj_states?.delete()
	delete Interface.Panels.aj_states
})

function updateDisplay(state) {
	Texture.all.forEach((tex) => tex.updateMaterial())
	const changes = Object.keys(state)
	for (let i = 0; i < changes.length; i++) {
		const to = state[changes[i]]
		const from = changes[i]
		const tex = Texture.all.find((tex) => tex.uuid === to) || {
			name: 'transparent',
			source: transparent,
		}
		if (Project.materials[from] && tex) {
			Project.materials[from].name = tex.name
			Project.materials[from].map.name = tex.name
			Project.materials[from].map.image.src = tex.source
			Project.materials[from].map.needsUpdate = true
		}
	}
}
function Dialog({ children, onRequestHide }) {
	const ref = useRef()
	function hide(e) {
		e.preventDefault()
		onRequestHide()
	}
	useEffect(() => {
		if (ref.current) {
			let o = $(ref.current)
			o.draggable({
				handle: '.dialog_handle',
				containment: '#page_wrapper',
			})
			o.css('position', 'absolute')
			let x = Math.clamp((window.innerWidth - 256) / 2, 0, 2000)
			o.css('left', x + 'px')
		}
	}, [ref])
	useEffect(() => {
		const handler = (key) => {
			if (key.code === 'Escape') onRequestHide()
		}
		window.addEventListener('keydown', handler)
		return () => window.removeEventListener('keydown', handler)
	})
	return (
		<>
			<div
				style={{
					height: 'calc(100% - 26px)',
					width: '100%',
					position: 'absolute',
					left: '0px',
					top: '26px',
					zIndex: 19,
					backgroundColor: 'var(--color-dark)',
					opacity: 0.6,
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
					maxHeight: '580px',
					width: '256px',
					zIndex: 10001,
				}}
			>
				<div
					className="dialog_handle tl ui-draggable-handle"
					style={{ cursor: 'default' }}
				>
					<div className="dialog_title">
						{tl('animatedJava.dialogs.variants.title')}
					</div>
				</div>
				<div
					className="dialog_close_button"
					style={{ top: '0', right: '0', position: 'absolute' }}
					onClick={hide}
				>
					<i className="material-icons">clear</i>
				</div>
				<div
					className="tab_content"
					style={{
						paddingLeft: '1em',
						paddingRight: '1em',
						overflowY: 'scroll',
						height: '550px',
					}}
				>
					{children}
				</div>
			</dialog>
		</>
	)
}
function StatePanel() {
	const [editState, setEditState] = useState({})
	const [height, setHeight] = useState(0)
	const [dialogVisible, setDialogVisible] = useState(false)
	const List = useRef()
	const [states, setStates] = useState(
		store.get('states') || {
			default: {},
		}
	)
	const [selectedIndex, setSelectedIndex] = useState(false)
	const [overlayVisible, setOverlayVisible] = useState(null)
	useEffect(() => {
		if (List.current) {
			const top = List.current.getBoundingClientRect().top
			setHeight(Math.min(300, window.innerHeight - top))
		}
	}, [List])
	useEffect(() => {
		console.groupCollapsed('States Update')

		store.set('states', states)
		console.log('States', states)

		console.groupEnd('States Update')
	}, [states])
	const updateStateViewOnChange = React.useCallback(() => {
		const _states = Object.keys(states).sort((a, b) => a.localeCompare(b))
		if (selectedIndex !== false) {
			updateDisplay({})
			updateDisplay(states[_states[selectedIndex]])
		}
	}, [selectedIndex, states])
	useEffect(() => {
		bus.on(events.LIFECYCLE.LOAD_MODEL, () =>
			setStates(store.get('states'))
		)
		bus.on('states_ui_update', () => {
			setStates(store.get('states'))
			updateStateViewOnChange()
		})
	}, [])

	return (
		<div
			style={{
				overflowX: 'hidden',
				minHeight: '300px',
				maxHeight: '300px',
			}}
		>
			<div
				style={{
					width: '100%',
					transition: '0.5s',
					display: 'flex',
				}}
			>
				{dialogVisible && (
					<Dialog
						onRequestHide={() => {
							setDialogVisible(false)
						}}
					>
						<div>
							<p>
								{tl(
									'animatedJava.dialogs.variants.description'
								)}
							</p>
						</div>
						<div style={{ width: '100%', display: 'inline-block' }}>
							<ul
								style={
									{
										// height: height + 'px',
										// overflowY: 'scroll',
									}
								}
								ref={List}
							>
								{overlayVisible &&
									Texture.all.map((t1, i) => {
										return (
											<li
												key={i}
												style={{
													marginTop: '10px',
													// borderTop:'1px solid var(--color-border)',
												}}
											>
												<hr />
												<div
													style={{
														display: 'flex',
													}}
												>
													<img
														src={t1.source}
														width={30}
														height={30}
														style={{
															marginLeft: '11px',
															marginBottom:
																'12px',
														}}
													></img>
													<div
														style={{
															display:
																'inline-block',
															verticalAlign:
																'text-bottom',
															height: '30px',
															paddingLeft: '10px',
															paddingTop: '3px',
														}}
													>
														{t1.name}
													</div>
												</div>
												<Dropdown
													placeholder={'Default'}
													value={editState[t1.uuid]}
													options={[
														{
															id: 0,
															name: 'Default',
															value: 'Default',
															label: 'Default',
														},
														{
															id: 0,
															name: 'transparent',
															value: 'transparent',
															label: 'transparent',
														},
														...Texture.all
															.filter(
																(_) =>
																	_.uuid !==
																	t1.uuid
															)
															.sort(
																(a, b) =>
																	a === t1
															)
															.map((t2, i) => ({
																id: i + 2,
																name: t2.uuid,
																value: t2.uuid,
																label: (
																	<div
																		key={i}
																		style={{
																			display:
																				'flex',
																		}}
																	>
																		<img
																			src={
																				t2.source
																			}
																			width={
																				30
																			}
																			height={
																				30
																			}
																		></img>
																		<div
																			style={{
																				display:
																					'inline-block',
																				verticalAlign:
																					'text-bottom',
																				height: '30px',
																				paddingLeft:
																					'10px',
																				paddingTop:
																					'3px',
																			}}
																		>
																			{
																				t2.name
																			}
																		</div>
																	</div>
																),
															})),
													]}
													onChange={(v) => {
														if (
															t1.uuid ===
																v.value ||
															v.value ===
																'Default'
														) {
															delete editState[
																t1.uuid
															]
														} else {
															editState[t1.uuid] =
																v.value
														}
														updateDisplay(editState)
														console.log(editState)
													}}
												/>
											</li>
										)
									})}
							</ul>
						</div>
					</Dialog>
				)}
				<div style={{ width: '100%', display: 'inline-block' }}>
					<div className="toolbar-wrapper">
						<div className="content">
							<div
								className="tool add_animation"
								onClick={() => {
									let nextName
									let i = 0
									do {
										i++
										nextName = 'state_' + i
									} while (
										Object.keys(states).includes(nextName)
									)
									setStates({ ...states, [nextName]: {} })
								}}
							>
								<div
									className="tooltip"
									style={{ marginLeft: '0px' }}
								>
									{intl.tl(
										'animatedJava.panels.variants.addVariant.title'
									)}
									<div
										className="tooltip_description"
										style={{ marginLeft: '-5px' }}
									>
										{intl.tl(
											'animatedJava.panels.variants.addVariant.description'
										)}
									</div>
								</div>
								<i className="fa_big fa fa-plus-circle"></i>
							</div>
						</div>
					</div>
					<ul
						className="list"
						style={{
							maxHeight: '300px',
							overflowY: 'scroll',
						}}
					>
						{Object.keys(states)
							.sort((a, b) => a.localeCompare(b))
							.map(
								(state, index) =>
									states[state] && (
										<li
											key={state}
											className="animation_file"
										>
											<div className="animation_file_head">
												<label title="StateName">
													<input
														type="text"
														defaultValue={state}
														onBlur={(e) => {
															if (
																e.target
																	.value ===
																state
															)
																return
															if (
																e.target.value
																	.length >
																	0 &&
																!/[^a-z0-9\._]/.test(
																	e.target
																		.value
																) &&
																!states[
																	e.target
																		.value
																]
															) {
																const copy = {
																	...states,
																}
																copy[
																	e.target.value
																] = copy[state]
																delete copy[
																	state
																]
																//console.log(`changed name from '${state}' to '${e.target.value}'`)
																setStates(copy)
															} else {
																Blockbench.showQuickMessage(
																	'name invalid or already in use'
																)
																e.target.value =
																	state
															}
														}}
													></input>
												</label>
												<div
													className="in_list_button"
													onClick={() => {
														if (
															index ===
															selectedIndex
														) {
															setSelectedIndex(-1)
															updateDisplay({})
														} else {
															setSelectedIndex(
																index
															)
															updateDisplay(
																states[state]
															)
														}
													}}
												>
													<i
														className={
															index ===
															selectedIndex
																? 'fa fa-eye'
																: 'fa fa-eye-slash icon_off'
														}
													></i>
												</div>
												<div
													className="in_list_button"
													onClick={() => {
														setEditState(
															states[state]
														)
														setSelectedIndex(index)
														setOverlayVisible(state)
														setDialogVisible(true)
													}}
												>
													<i className="material-icons">
														edit
													</i>
												</div>
												{Object.keys(states).length >
													1 && (
													<div
														className="in_list_button"
														onClick={() => {
															const copy = {
																...states,
															}
															delete copy[state]
															setStates(copy)
														}}
													>
														<i className="material-icons">
															delete
														</i>
													</div>
												)}
											</div>
										</li>
									)
							)}
					</ul>
				</div>
			</div>
		</div>
	)
}
function find(query) {
	return new Promise((resolve) => {
		const id = setInterval(() => {
			let el
			if ((el = document.querySelector(query))) {
				clearInterval(id)
				resolve(el)
			}
		}, 50)
	})
}
find('#java-animator-states').then((el) => {
	el.previousElementSibling.children[0].innerHTML = intl.tl(
		'animatedJava.panels.variants.title'
	)
	ReactDom.render(<StatePanel></StatePanel>, el)
	bus.on(events.LIFECYCLE.CLEANUP, () => el.remove())
})

// blockbench does not notify you when a texture is removed so we need to notify ourselves
let $original
bus.on(LIFECYCLE.LOAD, () => {
	$original = Texture.prototype.remove
	Texture.prototype.remove = function (no_update) {
		bus.dispatch('texture_will_be_removed', this)
		return $original.call(this, no_update)
	}
})
bus.on(LIFECYCLE.UNLOAD, () => {
	Texture.prototype.remove = $original
})

bus.on('texture_will_be_removed', (texture) => {
	const states = store.get('states')
	console.log(states)
	let uuid = texture.uuid
	let updated = false
	let updated_states = []
	for (const state_name in states) {
		const sdat = states[state_name]
		let has_update = false
		for (const key in sdat) {
			if (key === uuid || sdat[key] === uuid) {
				delete sdat[key]
				has_update = true
			}
		}
		if (has_update) updated_states.push(state_name)
		updated = updated || has_update
	}
	if (updated_states.length) {
		Blockbench.showQuickMessage(
			`updated ${updated_states.length} states (${updated_states})`
		)
	}
	store.set('states', { ...states })
	bus.dispatch('states_ui_update', {})
})

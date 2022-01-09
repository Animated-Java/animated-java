import { bus } from '../../util/bus'
import events from '../../constants/events'
import React, { useEffect, useRef, useState } from 'react'
import ReactDom from 'react-dom'
import {
	DefaultSettings,
	ForeignSettingTranslationKeys,
	settings,
} from '../../settings'
import { tl } from '../../util/intl'
import { ERROR } from '../../util/errors'
const dialog = electron.dialog
let updateSettingsUiActions = {}
let forceUpdateSettingsUi = () => {
	Object.values(updateSettingsUiActions).forEach((action) => action())
}
const RenderTemplates = {
	checkbox({ value, setValue, namespace, name, children, forceRerender }) {
		return (
			<>
				<div className="setting_element">
					<input
						type={'checkbox'}
						id={`aj.setting.${namespace}.${name}`}
						checked={value}
						onChange={(e) => {
							try {
								settings[namespace][name] = e.target.checked
							} catch (e) {
								forceRerender()
							}
						}}
					/>
				</div>
				{children}
			</>
		)
	},
	filepath({
		value,
		setValue,
		namespace,
		name,
		children,
		target = 'file',
		dialogOpts = {},
		forceRerender,
	}) {
		return (
			<>
				<div>{children}</div>
				<div style={{ display: 'flex' }}>
					<div
						className="setting_element"
						style={{ marginTop: '0px' }}
					>
						<button
							style={{
								width: '32px',
								height: '32px',
								minWidth: 'unset',
								paddingLeft: '9px',
							}}
							onClick={() => {
								settings.set(
									`${namespace}.${name}`,
									DefaultSettings[namespace][name].default
								)
							}}
						>
							<span
								className="material-icons"
								style={{
									position: 'relative',
									top: '2px',
									right: '7px',
									fontSize: '28px',
								}}
							>
								delete_forever
							</span>
						</button>
					</div>
					<div
						className="setting_element"
						style={{ marginTop: '0px' }}
					>
						<button
							style={{
								width: '32px',
								height: '32px',
								minWidth: 'unset',
								paddingLeft: '6px',
								paddingTop: '4px',
							}}
							onClick={(e) => {
								e.preventDefault()
								let d
								if (target === 'file') {
									d = dialog.showSaveDialog(dialogOpts)
								} else {
									d = dialog.showOpenDialog(dialogOpts)
								}
								d.then((res) => {
									if (!res.canceled) {
										let fp

										if (target === 'file') fp = res.filePath
										else [fp] = res.filePaths
										if (fp != value) {
											try {
												settings[namespace][name] = fp
											} catch (e) {
												forceRerender()
											}
										}
									}
								})
							}}
						>
							<i
								className="material-icons icon"
								style={{
									position: 'relative',
									fontSize: '24px',
									right: '2px',
								}}
							>
								create_new_folder
							</i>
						</button>
					</div>
					<input
						type="text"
						id={`aj.setting.${namespace}.${name}`}
						value={value || ''}
						onChange={(e) => {
							setValue(e.target.value)
						}}
						onBlur={(e) => {
							try {
								settings[namespace][name] = e.target.value
							} catch (e) {
								forceRerender()
							}
						}}
						className="dark_bordered"
						style={{ width: 'calc(100% - 118px)' }}
					/>
				</div>
			</>
		)
	},
	select({
		value,
		setValue,
		namespace,
		name,
		children,
		definition,
		forceRerender,
	}) {
		return (
			<>
				{children}
				<div className="bar_select">
					<select
						id={`aj.setting.${namespace}.${name}`}
						value={value}
						onChange={(e) => {
							setValue(e.target.value)
							try {
								settings[namespace][name] = e.target.value
							} catch (e) {
								forceRerender()
							}
						}}
					>
						{Object.entries(definition.options).map(
							([key, value]) => (
								<option value={key} key={key}>
									{tl(value)}
								</option>
							)
						)}
					</select>
				</div>
			</>
		)
	},
}
export function registerSettingRenderer(type, renderer) {
	if (Reflect.has(RenderTemplates, type)) {
		ERROR.SETTING_RENDER_ALREADY_EXISTS({ type, renderer, RenderTemplates })
	} else {
		RenderTemplates[type] = renderer(React)
	}
}
const SettingInput = ({ namespace, name, template }) => {
	const [value, setValue] = useState(settings[namespace][name])
	const [isValid, setIsValid] = useState(true)
	const [isVisible, setIsVisible] = useState(true)
	const [rerender, setRerender] = useState(0)
	updateSettingsUiActions[`${namespace}.${name}`] = () =>
		setRerender(Math.random())
	useEffect(() => {
		// setValue(settings[namespace][name])
		return settings.watch(namespace + '.' + name, (v) => {
			queueMicrotask(() => {
				setValue(() => v)
			})
		})
	}, [])
	// useEffect(() => {
	// 	const ref = settings.storage.ref(namespace)
	// 	// ref.watch(() => {
	// 	//   setValue(ref.current[name]);
	// 	// });
	// 	return () => ref.delete()
	// }, [])
	const SettingDef = DefaultSettings[namespace][name]
	const isVis = SettingDef.isVisible
	useEffect(() => {
		const watchers = []
		if (SettingDef.dependencies) {
			SettingDef.dependencies.forEach((dep) => {
				watchers.push(
					settings.watch(dep, () => {
						setIsVisible(
							(typeof isVis === 'function' && isVis(settings)) ||
								!isVis
						)
					})
				)
			})
			setIsVisible(
				(typeof isVis === 'function' && isVis(settings)) || !isVis
			)
		}
		return () => watchers.forEach((cb) => cb())
	}, [])
	useEffect(() => {
		setIsValid(settings.getUpdateDescriptor(namespace, name, value).isValid)
	}, [value])
	let error = settings.getUpdateDescriptor(namespace, name, value).error
	const children = (
		<label
			htmlFor={`aj.setting.${namespace}.${name}`}
			className="setting_label"
		>
			<div className="setting_name">
				{!isValid && (
					<span
						style={{
							display: 'inline-block',
							opacity: 1,
							color: 'red',
							height: '0px',
							textAlign: 'center',
						}}
						title={
							error ||
							tl('animatedJava.settings.generic.errors.invalid')
						}
					>
						<span
							className="material-icons"
							style={{
								position: 'relative',
								top: '5px',
								lineHeight: '0em',
							}}
						>
							clear
						</span>
					</span>
				)}
				{SettingDef.title}
				{SettingDef.global && (
					<span
						style={{
							opacity: 0.8,
							marginLeft: '1em',
						}}
					>
						{tl('animatedJava.settings.isGlobal')}
					</span>
				)}
				{SettingDef.optional && (
					<span
						style={{
							opacity: 0.8,
							marginLeft: '1em',
						}}
					>
						{tl('animatedJava.settings.isOptional')}
					</span>
				)}
			</div>
			{!isValid && error && (
				<div>
					<p>
						<strong style={{ color: 'red' }}>{error}</strong>
					</p>
				</div>
			)}
			<div
				className="setting_description"
				dangerouslySetInnerHTML={{ __html: SettingDef.description }}
			></div>
		</label>
	)
	if (isVisible) {
		if (Reflect.has(RenderTemplates, template.type)) {
			const Type = RenderTemplates[template.type]
			return (
				<>
					<Type
						value={value}
						setValue={(v) => {
							setIsValid(
								settings.getUpdateDescriptor(namespace, name, v)
									.isValid
							)
							setValue(v)
						}}
						namespace={namespace}
						name={name}
						definition={SettingDef}
						forceRerender={() => setRerender(Math.random())}
						{...(template.props || {})}
					>
						{children}
					</Type>
				</>
			)
		} else {
			return (
				<>
					{children}
					<input
						type={template.type}
						id={`aj.setting.${namespace}.${name}`}
						value={value}
						onChange={(e) => {
							setValue(e.target.value)
						}}
						onBlur={(e) => {
							try {
								settings[namespace][name] = e.target.value
							} catch (e) {
								// setValue(e.target.value)
								setRerender(Math.random())
							}
						}}
						className="dark_bordered"
						style={{ width: 'calc(100% - 18px)' }}
					/>
				</>
			)
		}
	} else {
		return null
	}
}
const Settings = () => {
	const [, forceRerender] = useState(0)
	updateSettingsUiActions.main = () => forceRerender(Math.random())
	const ref = useRef()
	useEffect(() => {
		if (ref.current) {
			let o = $(ref.current)
			o.draggable({
				handle: '.dialog_handle',
				containment: '#page_wrapper',
			})
			o.css('position', 'absolute')
			let x = Math.clamp((window.innerWidth - 768) / 2, 0, 2000)
			o.css('left', x + 'px')
		}
	}, [ref])
	return (
		<>
			<div
				style={{
					height: 'calc(100% - 26px)',
					width: '100%',
					zIndex: 19,
					backgroundColor: 'var(--color-dark)',
					opacity: 0.6,
					position: 'absolute',
					left: '0px',
					top: '26px',
				}}
				onClick={hide_settings}
			></div>
			<dialog
				ref={ref}
				className="dialog paddinged ui-resizable ui-draggable draggable"
				style={{
					display: 'block',
					left: '0%',
					top: '128px',
					// maxHeight: '1024px',
					height: '79.2%',
					width: '768px',
					zIndex: 10001,
				}}
			>
				<div
					className="dialog_handle tl ui-draggable-handle"
					style={{ cursor: 'default' }}
				>
					<div className="dialog_title">
						{tl('animatedJava.menubar.settings')}
					</div>
				</div>
				<div
					className="dialog_close_button"
					style={{ top: '0', right: '0', position: 'absolute' }}
					onClick={hide_settings}
				>
					<i className="material-icons">clear</i>
				</div>
				<div className="tab_content">
					<ul
						style={{ maxHeight: '75vh', overflowY: 'scroll' }}
						className="WHYCSSWHY-or-settings"
					>
						<li>
							<h2
								className="tl i_b"
								style={{ marginLeft: '1em' }}
							>
								{tl('animatedJava.settings.header')}
							</h2>
							<ul style={{ marginLeft: '2em' }}>
								{Object.keys(DefaultSettings.animatedJava).map(
									(child, id) => (
										<li key={child}>
											<SettingInput
												namespace={'animatedJava'}
												name={child}
												template={
													DefaultSettings
														.animatedJava[child]
												}
											></SettingInput>
										</li>
									)
								)}
							</ul>
						</li>
						<li>
							<ul>
								<h2 style={{ marginLeft: '1em' }}>
									{tl('animatedJava.menubar.export')}
								</h2>
								{Object.keys(DefaultSettings)
									.filter((key) => key !== 'animatedJava')
									.map((key, index) => {
										const children = Object.keys(
											DefaultSettings[key]
										)
										return (
											// SettingsPanel(key, setRevealedIndex, index, revealedIndex, children)
											<SettingsPanel
												key={key}
												name={
													ForeignSettingTranslationKeys[
														key
													] || key
												}
												id={key}
												childrenSettings={children}
											/>
										)
									})}
							</ul>
						</li>
					</ul>
				</div>
			</dialog>
		</>
	)
}

function SettingsPanel({ childrenSettings, name, visible, id }) {
	const [shown, setShown] = useState(visible)
	return (
		<DropDown visible={shown} onClick={() => setShown(!shown)} name={name}>
			<ul style={{ marginLeft: '2em' }}>
				{childrenSettings.map((child) => (
					<li key={child}>
						<SettingInput
							namespace={id}
							name={child}
							template={DefaultSettings[id][child]}
						></SettingInput>
					</li>
				))}
			</ul>
		</DropDown>
	)
}
function DropDown({ children, onClick, visible, name, intl }) {
	return (
		<>
			<h3
				onClick={onClick}
				style={{
					display: 'flex',
					alignItems: 'center',
				}}
			>
				<i className="material-icons">
					{visible ? 'expand_more' : 'navigate_next'}
				</i>
				{tl(intl || `${name}`)}
			</h3>
			{visible && children}
		</>
	)
}
const el = document.createElement('div')
el.id = 'aj-settings'
el.hidden = true
document.body.appendChild(el)
let visible = false
function hide_settings() {
	el.hidden = true
	visible = false
}
export function show_settings() {
	mouseUpYet = true
	console.log('show settings')
	el.hidden = false
	visible = true
	forceUpdateSettingsUi()
	Array.from(el.children).forEach((child) => {
		child.style.display = 'unset'
	})
}
queueMicrotask(() => {
	ReactDom.render(<Settings></Settings>, el)
	const s = document.createElement('style')
	el.appendChild(s)
	s.innerHTML = Array.from(
		document.head.querySelector('link[href="css/dialogs.css"]').sheet.rules
	)
		.filter((rule) => rule.selectorText?.indexOf('#settingslist') > -1)
		.map((rule) => {
			return rule.cssText.replace(
				/#settingslist/g,
				'.WHYCSSWHY-or-settings'
			)
		})
		.join('')
	bus.on(events.LIFECYCLE.CLEANUP, () => {
		el.remove()
		s.remove()
	})
	const _handler = (key) => {
		if (key.code === 'Escape' && visible) hide_settings()
	}
	window.addEventListener('keydown', _handler)
	bus.on(events.LIFECYCLE.UNLOAD, () => {
		window.removeEventListener('keydown', _handler)
	})
})

import { bus } from '../../util/bus'
import events from '../../constants/events'
import React, { useEffect, useRef, useState } from 'react'
import ReactDom from 'react-dom'
import { DefaultSettings, settings } from '../../settings'
import { translate } from '../../util/intl'
import { ERROR } from '../../util/errors'
const dialog = electron.dialog
const RenderTemplates = {
	checkbox({ value, setValue, namespace, name, children }) {
		return (
			<>
				<div className="setting_element">
					<input
						type={'checkbox'}
						id={`aj.setting.${namespace}.${name}`}
						checked={value}
						onChange={(e) => {
							settings[namespace][name] = e.target.checked
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
							onClick={() =>
								(settings[namespace][name] =
									DefaultSettings[namespace][name].default)
							}
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
											settings[namespace][name] = fp
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
							settings[namespace][name] = e.target.value
						}}
						className="dark_bordered"
						style={{ width: 'calc(100% - 118px)' }}
					/>
				</div>
			</>
		)
	},
	// textarea({ value, setValue, namespace, name, children }) {
	// 	return (
	// 		<>
	// 			<div>{children}</div>
	// 			<div style={{ display: 'inline-block' }}>
	// 				<textarea
	// 					id={`aj.setting.${namespace}.${name}`}
	// 					value={value || ''}
	// 					onChange={(e) => {
	// 						setValue(e.target.value)
	// 					}}
	// 					onBlur={(e) => {
	// 						settings[namespace][name] = e.target.value
	// 					}}
	// 					className="dark_bordered"
	// 					style={{ width: '389%' }}
	// 				/>
	// 			</div>
	// 		</>
	// 	)
	// },
	select({ value, setValue, namespace, name, children, definition }) {
		return (
			<>
				{children}
				<div className="bar_select">
					<select
						id={`aj.setting.${namespace}.${name}`}
						value={value}
						onChange={(e) => {
							settings[namespace][name] = e.target.value
						}}
					>
						{Object.entries(definition.options).map(
							([key, value]) => (
								<option value={key} key={key}>
									{translate(value)}
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

	useEffect(() => {
		// setValue(settings[namespace][name])
		return settings.watch(namespace + '.' + name, (v) => {
			setValue(v)
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
		setIsValid(DefaultSettings[namespace][name].isValid(value))
	}, [value])
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
						title={translate(
							'animatedJava.settings.invalidSetting.generic'
						)}
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
				{translate(`${namespace}.setting.${name}.name`)}
				{DefaultSettings[namespace][name].global && (
					<span
						style={{
							opacity: 0.8,
							marginLeft: '1em',
						}}
					>
						{translate('animatedJava.settings.global')}
					</span>
				)}
				{DefaultSettings[namespace][name].optional && (
					<span
						style={{
							opacity: 0.8,
							marginLeft: '1em',
						}}
					>
						{translate('animatedJava.settings.optional')}
					</span>
				)}
			</div>
			<div className="setting_description">
				{translate(`${namespace}.setting.${name}.description`)
					.split('\n')
					.map((line, i) => (
						<p key={i}>{line}</p>
					))}
			</div>
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
							if (DefaultSettings[namespace][name].isValid(v)) {
								setIsValid(true)
							} else {
								setIsValid(false)
							}
							setValue(v)
						}}
						namespace={namespace}
						name={name}
						definition={DefaultSettings[namespace][name]}
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
							settings[namespace][name] = e.target.value
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
					width: '50%',
					zIndex: 10001,
				}}
			>
				<div
					className="dialog_handle tl ui-draggable-handle"
					style={{ cursor: 'default' }}
				>
					{translate('animatedJava.menubar.settings.name')}
					<div
						className="dialog_close_button"
						style={{ top: '0', right: '0' }}
						onClick={hide_settings}
					>
						<i className="material-icons">clear</i>
					</div>
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
								Animated Java Settings
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
									{translate(
										'animatedJava.menubar.exporterList.name'
									)}
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
												name={key}
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

function SettingsPanel({ childrenSettings, name, visible }) {
	const [shown, setShown] = useState(visible)
	return (
		<DropDown visible={shown} onClick={() => setShown(!shown)} name={name}>
			<ul style={{ marginLeft: '2em' }}>
				{childrenSettings.map((child, id) => (
					<li key={child}>
						<SettingInput
							namespace={name}
							name={child}
							template={DefaultSettings[name][child]}
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
				{translate(intl || `${name}`)}
			</h3>
			{visible && children}
		</>
	)
}
const el = document.createElement('div')
el.id = 'aj-settings'
el.hidden = true
document.body.appendChild(el)
function hide_settings() {
	el.hidden = true
}
let mouseUpYet = false
export function show_settings() {
	mouseUpYet = true
	console.log('show settings')
	el.hidden = false
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
})

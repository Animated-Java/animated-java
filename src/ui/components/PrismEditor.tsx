import * as React from 'react'
import { styles } from './PrismEditor.module.less'
import '../prism-languages/snbt'
import type * as PrismJS from 'prismjs'
import { useState } from 'react'
import { useEffect } from 'react'
import { SNBT } from '../../util/SNBT'
type PrismEditorOverlay = React.FC<{
	value?: string
	setValue?: (value: string) => void
	height?: number
}>
interface PrismEditorProps {
	prism: {
		highlight(code: string, language: PrismJS.Grammar, name: string): string
		languages: PrismJS.LanguageMap
	}
	initialValue: string
	onChange?(value: string): void
	language: string
	overlay: PrismEditorOverlay
}
export const PrismEditor: React.FC<PrismEditorProps> = ({
	prism,
	initialValue,
	onChange,
	language,
	overlay,
}: PrismEditorProps) => {
	const Overlay = overlay
	const [value, setValue] = useState<string>(initialValue)
	const [highlightHTML, setHighlightHTML] = useState<string>('')
	const [elementHeight, setElementHeight] = useState<number>(300)
	const [pre, setPre] = useState<HTMLPreElement>()
	useEffect(() => {
		setValue(initialValue)
	}, [initialValue])
	useEffect(() => {
		if (onChange) {
			onChange(value)
		}
		setHighlightHTML(prism.highlight(value, prism.languages[language], language))
		if (pre) {
			setElementHeight(pre.offsetHeight)
		}
	}, [value, onChange, prism, language, pre])
	return (
		<div className={styles.size}>
			<textarea
				style={{
					height: Math.max(300, elementHeight) + 'px',
				}}
				className={styles.textarea}
				value={value}
				onChange={e => {
					setValue(e.target.value)
				}}
			></textarea>
			<pre
				className={styles.pre}
				ref={(el: HTMLPreElement | null) => {
					if (el) {
						setPre(el)
						setElementHeight(el.offsetHeight)
					}
				}}
			>
				<code dangerouslySetInnerHTML={{ __html: highlightHTML }}></code>
			</pre>
			{Overlay && (
				<div className={styles.overlay}>
					<Overlay
						value={value}
						setValue={setValue}
						height={Math.max(300, elementHeight)}
					></Overlay>
				</div>
			)}
		</div>
	)
}
interface SNBTEditorProps {
	initialValue: string
	onChange(value: string): void
}
const SNBTEditorOverlay: PrismEditorOverlay = ({ value, setValue, height }) => {
	const [isValid, setIsValid] = useState(false)
	const [error, setError] = useState(null)
	useEffect(() => {
		try {
			SNBT.parse(value)
			setIsValid(true)
			setError(null)
		} catch (e) {
			setIsValid(false)
			setError(e.message)
		}
	}, [value])
	return (
		<div style={{ display: 'flex' }}>
			{!error && (
				<button
					disabled={!isValid}
					onClick={() => {
						if (isValid) {
							setValue(SNBT.parse(value).toPrettyString())
						}
					}}
				>
					format
				</button>
			)}
			{error && (
				<>
					<br />
					<p
						style={{
							backgroundColor: 'rgba(255,0,0,0.6)',
							borderRadius: '5px',
						}}
					>
						{error}
					</p>
				</>
			)}
		</div>
	)
}
export const SNBTEditor: React.FC<SNBTEditorProps> = (props: SNBTEditorProps) => {
	return (
		<PrismEditor
			initialValue={props.initialValue}
			prism={globalThis.Prism}
			language="snbt"
			overlay={SNBTEditorOverlay}
			onChange={props.onChange}
		></PrismEditor>
	)
}

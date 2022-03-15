import ReactDOM from 'react-dom'
import React from 'react'

export function renderToDOM(fn, target = document.createElement('div')) {
	ReactDOM.render(React.createElement(fn), target)
	return target
}
export function componentize(fn) {
	let id = Math.random().toString(36).substr(2)
	const name = `vue_react_container_${id}`
	const component = {
		name,
		template: `<div id="${id}"></div>`,
		created() {
			queueMicrotask(() => {
				renderToDOM(fn, document.getElementById(id))
			})
		},
	}
	return component
}

import * as React from 'react'

const pageMap = new Map<string, React.FC>()
export function registerPage(path: string, component: React.FC): void {
	pageMap.set(path, component)
}
export {}

type ConditionType = undefined | boolean | number | Partial<{
	modes: string[]
	formats: string[]
	tools: string[]
	method: (context: any) => boolean
}>

/**
 * Tests if a condition is truthy of falsy. Returns true if the condition is unspecified
 * @param condition Boolean, function, object or anything else
 */
declare function Condition(condition: any): boolean

/**
 * Wrapper for objects that tells the custom JSON exporter to write in one line
 */
declare class oneLiner {
	constructor(data: object)
}

declare const templog: (...args: any) => void

/**
 * If the input event is a touch event, convert touch event to a compatible mouse event
 */
declare function convertTouchEvent(event: MouseEvent): MouseEvent

/**
 * Adds an event listener to an element, except that is supports multiple event types simultaneously
 * @param element Target Element
 * @param events Event types, separated by space characters
 * @param func Function
 * @param option Option
 */
declare function addEventListeners(element: HTMLElement, events: string, func: (event: Event) => void, option?: any)

declare function trimFloatNumber(value: number): string
declare function getAxisLetter(axisNumber: number): string
declare function getAxisNumber(axisLetter: string): number

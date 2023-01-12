//GENERATED FILE
declare module 'worker!./renderer.worker' {
	interface DataHiarchy {}interface AnimationDataBundle {keyframes: {[key: string]: {bezier: {left_time: numberleft_value: numberright_time: numberright_value: numberlinked: boolean}data_points: {x: numbery: numberz: number}[]time: numberinterpolation: numberchannel: string}[]}length: number}interface DataOutliner {rot: [number, number, number]origin: [number, number, number]children: DataOutliner[]id: string}type Data = {outliner: DataOutlineranimation: AnimationDataBundle}type Result = {}class TypedWorker extends Worker {
		constructor()
		subscribe(callback: (arg:Result)=>void): ()=>void
		postMessage(message: Data): void
	}
	export = TypedWorker
}
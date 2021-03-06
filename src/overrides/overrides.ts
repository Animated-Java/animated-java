import { store } from '../util/store'
import * as obj3dOverrides from './Object3d/index'

/******************************\
|                              |
|    scoped variables(file)    |
|                              |
\******************************/

const globals = store.getStore('global')

function merge(Obj: any, overrides: any) {
	const keys = Object.keys(overrides)
	if (!globals.has(Obj))
		for (let i = 0; i < keys.length; i++) {
			const name = keys[i]
			const value = overrides[name]
			Obj.prototype[name] = undefined
			Object.defineProperty(Obj.prototype, name, value)
		}
}
// @ts-ignore
merge(THREE.Object3D, obj3dOverrides)

type DialogItemValueChecker<Value> =
	| ((value: Value) => { type: string; message: string })
	| undefined

interface CollectionItem {
	icon?: string
	name: string
	value: string
}

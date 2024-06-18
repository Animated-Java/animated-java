type DialogItemValueChecker<Value> =
	| ((value: Value) => { type: string; message: string })
	| undefined

type CollectionItem = { name: string; value: string }

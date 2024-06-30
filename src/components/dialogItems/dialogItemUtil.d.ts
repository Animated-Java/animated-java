type DialogItemValueChecker<Value> =
	| ((value: Value) => { type: string; message: string })
	| undefined

type CollectionItem = { icon?: string; name: string; value: string }

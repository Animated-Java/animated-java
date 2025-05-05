type DialogItemValueChecker<Value> =
	| ((
			value: Value
	  ) =>
			| { type: 'success' }
			| { type: 'error'; message: string }
			| { type: 'warning'; message: string })
	| undefined

interface CollectionItem {
	icon?: string
	name: string
	value: string
}

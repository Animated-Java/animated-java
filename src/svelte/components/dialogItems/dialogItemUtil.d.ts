type DialogItemValueChecker<Value> =
	| ((
			value: Value
	  ) =>
			| { type: 'success' }
			| { type: 'warning'; message: string }
			| { type: 'error'; message: string })
	| undefined

type CollectionItem = { icon?: string; name: string; value: string }

type DialogItemValueChecker<Value> =
	| ((value: Value) => {
			type: 'success' | 'warning' | 'error'
			message?: string
	  })
	| undefined

type CollectionItem = { icon?: string; name: string; value: string }

type DialogItemValueChecker<Value> =
	| ((value: Value) => { type: string; message: string })
	| undefined

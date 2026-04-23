export type ValueCheckResult =
	| {
			type: 'error' | 'warning'
			message: string
	  }
	| undefined

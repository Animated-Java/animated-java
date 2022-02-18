export interface TreeLeaf {
	type: 'leaf'
	index: number
	item: any
}

export interface TreeBranch {
	type: 'branch'
	items?: TreeBranch[] | TreeLeaf[]
	min: number
	max: number
}

export function generateTree(items: any[]): TreeBranch | TreeLeaf {
	const depth = () => Math.floor(Math.log(items.length) / Math.log(8))
	const dat = [...items]
	let idx = 0
	function recurse(myDepth = 0) {
		let min = idx,
			max = null
		let res = []
		for (let i = 0; i < 8; i++) {
			if (dat.length === 0) break
			if (myDepth < depth() && dat.length >= 8 - i) {
				res.push(recurse(myDepth + 1))
			} else {
				res.push({
					type: 'leaf',
					item: dat.shift(),
					index: idx,
				} as TreeLeaf)
				idx++
			}
		}
		max = idx
		if (res.length === 1) return res[0]
		return { min, max, items: res, type: 'branch' } as TreeBranch
	}
	return recurse()
}

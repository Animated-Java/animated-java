export function generateTree(items) {
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
				res.push({ type: 'item', item: dat.shift(), index: idx })
				idx++
			}
		}
		max = idx
		if (res.length === 1) return res[0]
		return { min, max, items: res, type: 'layer' }
	}
	return recurse()
}

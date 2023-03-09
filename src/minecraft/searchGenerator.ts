interface ITreeLeaf<T> {
	type: 'leaf'
	scoreIndex: number
	item: T
}

interface ITreeBranch<T> {
	type: 'branch'
	items?: Array<ITreeBranch<T> | ITreeLeaf<T>>
	minScoreIndex: number
	maxScoreIndex: number
}

export function generateSearchTree<T>(items: T[]): ITreeBranch<T> | ITreeLeaf<T> {
	const depth = () => Math.floor(Math.log(items.length) / Math.log(8))
	const remainingItems = [...items]
	let scoreIndex = 0
	function recurse(myDepth = 0): ITreeBranch<T> | ITreeLeaf<T> {
		const minScoreIndex = scoreIndex
		let maxScoreIndex = null
		const tree: Array<ITreeBranch<T> | ITreeLeaf<T>> = []
		for (let i = 0; i < 8; i++) {
			if (remainingItems.length === 0) break
			if (myDepth < depth() && remainingItems.length >= 8 - i) {
				tree.push(recurse(myDepth + 1))
			} else {
				tree.push({
					type: 'leaf',
					item: remainingItems.shift()!,
					scoreIndex: scoreIndex,
				})
				scoreIndex++
			}
		}
		maxScoreIndex = scoreIndex
		if (tree.length === 1) return tree[0]
		return { minScoreIndex, maxScoreIndex, items: tree, type: 'branch' } as ITreeBranch<T>
	}
	return recurse()
}

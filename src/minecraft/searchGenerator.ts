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

export function generateSearchTree<T>(
	items: T[],
	trimmer?: (item: ITreeBranch<T> | ITreeLeaf<T>) => boolean | void
): ITreeBranch<T> | ITreeLeaf<T> | undefined {
	const depth = () => Math.floor(Math.log(items.length) / Math.log(8))
	const remainingItems = [...items]
	let scoreIndex = 0
	function recurse(myDepth = 0): ITreeBranch<T> | ITreeLeaf<T> | undefined {
		const minScoreIndex = scoreIndex
		let maxScoreIndex = null
		const tree: Array<ITreeBranch<T> | ITreeLeaf<T>> = []
		for (let i = 0; i < 8; i++) {
			if (remainingItems.length === 0) break
			if (myDepth < depth() && remainingItems.length >= 8 - i) {
				const item = recurse(myDepth + 1)
				if (trimmer && item) {
					if (trimmer(item)) tree.push(item)
				} else if (item) tree.push(item)
			} else {
				const item: ITreeLeaf<T> = {
					type: 'leaf',
					item: remainingItems.shift()!,
					scoreIndex: scoreIndex,
				}
				if (trimmer && item) {
					if (trimmer(item)) tree.push(item)
				} else if (item) tree.push(item)
				scoreIndex++
			}
		}
		maxScoreIndex = scoreIndex - 1
		if (tree.length === 1) {
			if (trimmer && !trimmer(tree[0])) return
			return tree[0]
		}
		return { minScoreIndex, maxScoreIndex, items: tree, type: 'branch' } as ITreeBranch<T>
	}
	return recurse()
}

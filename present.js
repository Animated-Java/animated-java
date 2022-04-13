;(() => {
	function write(o, name, g) {
		Object.defineProperty(o, name, {
			get() {
				return g()
			},
			configurable: true,
		})
	}
	function itterator(arr, path = [], res = {}) {
		let count = 0
		arr.forEach(item => {
			if (item instanceof Group) {
				const current = ['bones', item.name]
				const base = current.join('.')
				const mesh = item.mesh
				write(res, `${base}.pos.x`, () => mesh.position.x)
				write(res, `${base}.pos.y`, () => mesh.position.y)
				write(res, `${base}.pos.z`, () => mesh.position.z)
				write(res, `${base}.rot.rad.x`, () => mesh.rotation.x)
				write(res, `${base}.rot.rad.y`, () => mesh.rotation.y)
				write(res, `${base}.rot.rad.z`, () => mesh.rotation.z)
				write(res, `${base}.rot.deg.x`, () => Math.radToDeg(mesh.rotation.x))
				write(res, `${base}.rot.deg.y`, () => Math.radToDeg(mesh.rotation.y))
				write(res, `${base}.rot.deg.z`, () => Math.radToDeg(mesh.rotation.z))
				count += 6 + itterator(item.children, current, res)
			}
		})
		return count
	}
	function clear_vars() {
		Object.getOwnPropertyNames(Animator.MolangParser.global_variables).forEach(prop => {
			if (prop.startsWith('bones')) {
				delete Animator.MolangParser.global_variables[prop]
			}
		})
	}
	function applyBoneGetters() {
		clear_vars()
		const count = itterator(Outliner.root, [], Animator.MolangParser.global_variables)
		Blockbench.showQuickMessage(
			`added ${count} molangs to Animator.MolangParser.global_variables`
		)
	}
	const cb = ({ mode }) => {
		if (mode.id === 'animate') {
			applyBoneGetters()
		}
	}

	Plugin.register('present', {
		title: 'A present for snave from FetchBot',
		author: 'FetchBot',
		description: 'adds many molangs to the Animator.MolangParser.global_variables',
		version: '1.0.0',
		variant: 'both',
		onload() {
			Blockbench.on('select_mode', cb)
		},
		onuninstall() {
			clear_vars()
			Blockbench.removeEventListener('select_mode', cb)
		},
	})
})()

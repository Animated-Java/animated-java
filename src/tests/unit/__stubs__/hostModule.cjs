// Generic stand-in for modules that reach into Blockbench's host globals when
// loaded. The unit lane only exercises pure functions that never call into
// these, so every default / named import resolves to a harmless no-op.
//
// Referenced from `jest.unit.config.mjs`'s `moduleNameMapper`.
module.exports = new Proxy(
	{ __esModule: true },
	{
		get(target, prop) {
			if (prop in target) return target[prop]
			return () => undefined
		},
	}
)

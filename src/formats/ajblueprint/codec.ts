export const AJBLUEPRINT_CODEC = new Blockbench.Codec('animated-java:ajblueprint', {
	name: 'Animated Java Blueprint',
	extension: 'ajblueprint',
	remember: true,
	load_filter: {
		extensions: ['ajblueprint'],
		type: 'json',
	},
})

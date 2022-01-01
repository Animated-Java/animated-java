const AnimatedJavaBabelTransformPlugin = require('./tools/babelTransform')
module.exports = {
	include: '*',
	presets: [
		[
			'@babel/preset-env',
			{
				targets: {
					node: '12.13.0',
				},
			},
		],
		['@babel/preset-react'],
	],
	plugins: [
		'@babel/plugin-proposal-class-properties',
		AnimatedJavaBabelTransformPlugin,
	],
}

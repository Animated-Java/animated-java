const babel = require('@babel/core')

module.exports = function AnimatedJavaBabelTransformPlugin() {
	return {
		visitor: {
			NewExpression: (path) => {
				const node = path.node
				if (node.callee.name === 'Promise') {
					path.replaceWith(
						babel.types.callExpression(
							babel.types.identifier('PromiseWrapper'),
							[node]
						)
					)
					path.skip()
				}
			},
			ArrowFunctionExpression: (path) => {
				const node = path.node
				if (node.async) {
					const body = node.body
					node.body = babel.types.blockStatement([
						babel.types.tryStatement(
							body,
							babel.types.catchClause(
								babel.types.identifier('e'),
								babel.types.blockStatement([
									babel.types.expressionStatement(
										babel.types.callExpression(
											babel.types.identifier(
												'ANIMATED_JAVA.asyncError'
											),
											[babel.types.identifier('e')]
										)
									),
								])
							)
						),
					])
					path.skip()
				}
			},
			FunctionDeclaration: (path) => {
				const node = path.node
				if (node.async) {
					const body = node.body
					node.body = babel.types.blockStatement([
						babel.types.tryStatement(
							body,
							babel.types.catchClause(
								babel.types.identifier('e'),
								babel.types.blockStatement([
									babel.types.expressionStatement(
										babel.types.callExpression(
											babel.types.identifier(
												'ANIMATED_JAVA.asyncError'
											),
											[babel.types.identifier('e')]
										)
									),
								])
							)
						),
					])
					path.skip()
				}
			},
		},
	}
}

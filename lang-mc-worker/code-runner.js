function bindCodeToEnv(code, env) {
	let args = []
	let params = []
	for (let name in env) {
		params.push(name)
		args.push(env[name])
	}
	params.push(`return function(){\n${code}\n}`)
	return new Function(...params)(...args)
}
function evaluateCodeWithEnv(code, env) {
	return bindCodeToEnv(code, env)()
}
export { evaluateCodeWithEnv, bindCodeToEnv }

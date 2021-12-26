import { load } from 'js-yaml'
import { readFileSync } from 'fs'
const env = load(readFileSync('./env.yaml', 'utf-8'))
console.log(env)
export default function (str, mergeEnv = {}) {
	const ENV = Object.assign({}, env, mergeEnv)
	for (const key in ENV) {
		ENV[key] = JSON.stringify(ENV[key])
		for (const key2 in ENV)
			ENV[key] = ENV[key].replace(`{${key2}}`, ENV[key2])
	}
	for (const key in ENV) {
		str = str.replace(new RegExp(`process\.env\.${key}`, 'g'), ENV[key])
	}
	return str
}

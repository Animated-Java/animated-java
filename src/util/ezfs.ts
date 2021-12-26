// @ts-ignore
import * as fs from 'fs'

export function mkdir(path: string, options: fs.MakeDirectoryOptions) {
	try {
		fs.mkdirSync(path, options)
	} catch (e: any) {
		console.error(e)
	}
}

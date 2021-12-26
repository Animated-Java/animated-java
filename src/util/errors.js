import { makeError } from './makeError'
export class ERROR {
	static ANIMATED_JAVA_BUSY = makeError(
		'ERR_ANIMATED_JAVA_BUSY',
		'Animated Java is already busy performing a task.',
		'Animated Java is most likely already performing a build right now, please wait a moment then try again'
	)
	static DID_NOT_FIND_FILE = makeError(
		'ERR_DID_NOT_FIND_FILE',
		'failed to find a file.',
		'Animated Java tried to locate a file in your file system and failed, please see the meta information for the file path'
	)
	static SETTING_RENDER_ALREADY_EXISTS = makeError(
		'SETTING_RENDER_ALREADY_EXISTS',
		'attempted to create a setting render while one already exists with the same name',
		'A Plugin tried to add a setting render to animated java while one of the same name already exists.'
	)
}

import type { Chars, RestrictString, SliceString } from './stringUtils'

type AllowedCharacters = Chars.LowercaseAlphaNumeric | '-'

type FontAwesomeIconID<ID extends string> = ID extends `fa:${infer After}`
	? After extends RestrictString<After, AllowedCharacters>
		? ID
		: `Invalid icon name: ${RestrictString<After, AllowedCharacters>}`
	: "Invalid prefix, must start with 'fa:'"

/**
 * Formats font awesome icon IDs as Blockbench expects
 */
export function formatFaIcon<ID extends string>(id: FontAwesomeIconID<ID>) {
	return id.replace(':', '-') as SliceString<ID, ':', 'after'>
}

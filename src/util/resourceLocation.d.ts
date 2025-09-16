import type { Chars, RestrictString } from './stringUtils'

// Underscore is purposefully excluded. Get over it :)
type NamespaceChars = Chars.LowercaseAlphaNumeric | '.' | '-'
type PathChars = NamespaceChars | '/'

/**
 * Validates Namespaced Resource Identifier.
 *
 * - Format: `namespace:path`
 * - Allowed characters: [a-z0-9.-]
 *
 * ```
 * // Valid
 * 'namespace:path', 'name-space:foo/bar.json', 'snavesutit.animated-java:blueprint-settings-dialog'
 *
 * // Invalid
 * 'Namespace:Path', 'namespace:path:extra', 'namespacepath'
 * ```
 */
export type ValidateResourceLocation<L extends string> = L extends `${infer N}:${infer P}`
	? N extends RestrictString<N, NamespaceChars>
		? P extends RestrictString<P, PathChars>
			? L
			: `Invalid Path: ${RestrictString<P, PathChars>}`
		: `Invalid Namespace: ${RestrictString<N, NamespaceChars>}`
	: 'No separator (:) found'

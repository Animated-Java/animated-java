import type { Chars, RestrictString } from './stringUtils'

// Underscore is purposefully excluded. Get over it :)
type NamespaceChars = Chars.LowercaseAlphaNumeric | '.' | '-'
type PathChars = NamespaceChars | '/'

export namespace ResourceLocation {
	export type ValidatePath<P extends string> = [P] extends [RestrictString<P, PathChars>]
		? P
		: `Invalid characters in path: ${Exclude<P, PathChars>}`

	export type ValidateNamespace<N extends string> = [N] extends [
		RestrictString<N, NamespaceChars>
	]
		? N
		: `Invalid characters in namespace: ${Exclude<N, NamespaceChars>}`

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
	export type Validate<L extends string> = L extends `${infer N}:${infer P}`
		? [N] extends [RestrictString<N, NamespaceChars>]
			? [P] extends [RestrictString<P, PathChars>]
				? L
				: ValidatePath<P>
			: ValidateNamespace<N>
		: 'No namespace separator (:) found'
}

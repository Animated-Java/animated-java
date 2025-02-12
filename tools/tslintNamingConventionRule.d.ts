/* eslint-disable @typescript-eslint/naming-convention */
declare namespace SharedConfig {
	export type Severity = 0 | 1 | 2
	export type SeverityString = 'error' | 'off' | 'warn'
	export type RuleLevel = Severity | SeverityString

	export type RuleLevelAndOptions = [RuleLevel, ...unknown[]]

	export type RuleEntry = RuleLevel | RuleLevelAndOptions
	export type RulesRecord = Partial<Record<string, RuleEntry>>

	export type GlobalVariableOptionBase =
		| 'off'
		| /** @deprecated use `'readonly'` */ 'readable'
		| 'readonly'
		| 'writable'
		| /** @deprecated use `'writable'` */ 'writeable'
	export type GlobalVariableOptionBoolean =
		| /** @deprecated use `'readonly'` */ false
		| /** @deprecated use `'writable'` */ true
	export type GlobalVariableOption = GlobalVariableOptionBase | GlobalVariableOptionBoolean

	export type GlobalsConfig = Record<string, GlobalVariableOption>
	export type EnvironmentConfig = Record<string, boolean>

	export interface PluginMeta {
		/**
		 * The meta.name property should match the npm package name for your plugin.
		 */
		name: string
		/**
		 * The meta.version property should match the npm package version for your plugin.
		 */
		version: string
	}
}

declare enum PredefinedFormats {
	camelCase = 1,
	strictCamelCase,
	PascalCase,
	StrictPascalCase,
	snake_case,
	UPPER_CASE,
}
declare type PredefinedFormatsString = keyof typeof PredefinedFormats

declare enum UnderscoreOptions {
	forbid = 1,
	allow,
	require,

	// special cases as it's common practice to use double underscore
	requireDouble,
	allowDouble,
	allowSingleOrDouble,
}
declare type UnderscoreOptionsString = keyof typeof UnderscoreOptions

declare enum Selectors {
	// variableLike
	variable = 1 << 0,
	function = 1 << 1,
	parameter = 1 << 2,

	// memberLike
	parameterProperty = 1 << 3,
	classicAccessor = 1 << 4,
	enumMember = 1 << 5,
	classMethod = 1 << 6,
	objectLiteralMethod = 1 << 7,
	typeMethod = 1 << 8,
	classProperty = 1 << 9,
	objectLiteralProperty = 1 << 10,
	typeProperty = 1 << 11,
	autoAccessor = 1 << 12,

	// typeLike
	class = 1 << 13,
	interface = 1 << 14,
	typeAlias = 1 << 15,
	enum = 1 << 16,
	typeParameter = 1 << 17,

	// other
	import = 1 << 18,
}
declare type SelectorsString = keyof typeof Selectors

declare enum MetaSelectors {
	default = -1,
	variableLike = 0 | Selectors.variable | Selectors.function | Selectors.parameter,
	memberLike = 0 |
		Selectors.classProperty |
		Selectors.objectLiteralProperty |
		Selectors.typeProperty |
		Selectors.parameterProperty |
		Selectors.enumMember |
		Selectors.classMethod |
		Selectors.objectLiteralMethod |
		Selectors.typeMethod |
		Selectors.classicAccessor |
		Selectors.autoAccessor,
	typeLike = 0 |
		Selectors.class |
		Selectors.interface |
		Selectors.typeAlias |
		Selectors.enum |
		Selectors.typeParameter,
	method = 0 | Selectors.classMethod | Selectors.objectLiteralMethod | Selectors.typeMethod,
	property = 0 |
		Selectors.classProperty |
		Selectors.objectLiteralProperty |
		Selectors.typeProperty,
	accessor = 0 | Selectors.classicAccessor | Selectors.autoAccessor,
}
declare type MetaSelectorsString = keyof typeof MetaSelectors
declare type IndividualAndMetaSelectorsString = MetaSelectorsString | SelectorsString

declare enum Modifiers {
	// const variable
	const = 1 << 0,
	// readonly members
	readonly = 1 << 1,
	// static members
	static = 1 << 2,
	// member accessibility
	public = 1 << 3,
	protected = 1 << 4,
	private = 1 << 5,
	'#private' = 1 << 6,
	abstract = 1 << 7,
	// destructured variable
	destructured = 1 << 8,
	// variables declared in the top-level scope
	global = 1 << 9,
	// things that are exported
	exported = 1 << 10,
	// things that are unused
	unused = 1 << 11,
	// properties that require quoting
	requiresQuotes = 1 << 12,
	// class members that are overridden
	override = 1 << 13,
	// class methods, object function properties, or functions that are async via the `async` keyword
	async = 1 << 14,
	// default imports
	default = 1 << 15,
	// namespace imports
	namespace = 1 << 16,

	// make sure TypeModifiers starts at Modifiers + 1 or else sorting won't work
}
declare type ModifiersString = keyof typeof Modifiers

declare enum TypeModifiers {
	boolean = 1 << 17,
	string = 1 << 18,
	number = 1 << 19,
	function = 1 << 20,
	array = 1 << 21,
}
declare type TypeModifiersString = keyof typeof TypeModifiers

interface MatchRegex {
	match: boolean
	regex: string
}

declare interface Selector {
	custom?: MatchRegex
	filter?: string | MatchRegex
	// format options
	format: PredefinedFormatsString[] | null
	leadingUnderscore?: UnderscoreOptionsString
	modifiers?: ModifiersString[]
	prefix?: string[]
	// selector options
	selector: IndividualAndMetaSelectorsString | IndividualAndMetaSelectorsString[]
	suffix?: string[]
	trailingUnderscore?: UnderscoreOptionsString
	types?: TypeModifiersString[]
}

export type NamingConventionRule = [SharedConfig.RuleEntry, ...Selector[]]

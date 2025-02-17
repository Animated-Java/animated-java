// @ts-expect-error
import checkFile from 'eslint-plugin-check-file'
import svelteEslint from 'eslint-plugin-svelte'
import svelteParser from 'svelte-eslint-parser'
import tsESLint, { type ConfigWithExtends } from 'typescript-eslint'
import svelteConfig from './svelte.config'
import type { NamingConventionRule } from './tools/tslintNamingConventionRule'

console.log(`[${new Date().toLocaleTimeString()}] Loading ESLint config`)

const IGNORE_PATTERNS = [
	'.DS_Store',
	'.env',
	'.env.*',
	'.github',
	'.vscode',
	'**/node_modules/**',

	// Blockbench Plugin Template
	'dist/**/*',

	// Ignore files for PNPM, NPM and YARN
	'pnpm-lock.yaml',
	'package-lock.json',
	'yarn.lock',
]

const CUSTOM_RULES: ConfigWithExtends['rules'] = {
	// ESLint
	semi: ['error', 'never'],
	'prefer-const': 'warn',
	'no-fallthrough': 'off',
	'no-mixed-spaces-and-tabs': 'off',
	'no-unreachable': 'warn',
	'@typescript-eslint/no-unused-vars': [
		'warn',
		{
			vars: 'local',
			args: 'after-used',
			argsIgnorePattern: '^_',
			ignoreRestSiblings: true,
		},
	],
	// Svelte
	'svelte/html-quotes': ['warn', { prefer: 'double' }],
	'svelte/block-lang': ['error', { script: ['ts', null], style: null }],
	'svelte/comment-directive': ['error', { reportUnusedDisableDirectives: true }],
	// Check File
	'check-file/filename-naming-convention': [
		'error',
		{
			'src/**/*.{ts.d.ts}': 'CAMEL_CASE',
			'tools/**/*.{ts.d.ts}': 'CAMEL_CASE',
		},
	],
	'check-file/folder-naming-convention': [
		'error',
		{
			'src/**': 'KEBAB_CASE',
			'tools/**': 'KEBAB_CASE',
		},
	],
	// TypeScript
	'@typescript-eslint/no-explicit-any': 'off',
	'@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
	'@typescript-eslint/array-type': ['warn', { default: 'array-simple' }],
	'@typescript-eslint/consistent-indexed-object-style': ['warn', 'record'],
	'@typescript-eslint/consistent-generic-constructors': 'warn',
	'@typescript-eslint/no-namespace': 'off',
	'@typescript-eslint/restrict-template-expressions': 'off',
	'@typescript-eslint/no-unsafe-member-access': 'off',
	'@typescript-eslint/no-unsafe-assignment': 'off',
	'@typescript-eslint/ban-ts-comment': 'off',
	'@typescript-eslint/require-await': 'warn',
	'@typescript-eslint/no-unsafe-call': 'off',
	'@typescript-eslint/unbound-method': 'off',
	'@typescript-eslint/no-non-null-assertion': 'off',
	'@typescript-eslint/triple-slash-reference': 'off',
	// Naming conventions
	'@typescript-eslint/naming-convention': [
		'warn',
		{
			// DFU Version imports
			selector: ['import'],
			modifiers: ['default'],
			filter: {
				regex: 'v\\d+_\\d+_\\d+$',
				match: true,
			},
			custom: {
				match: true,
				regex: 'v\\d+_\\d+_\\d+$',
			},
			format: null,
		},
		{
			selector: ['import'],
			modifiers: ['default'],
			format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
		},
		{
			selector: 'class',
			format: ['PascalCase'],
		},
		{
			selector: ['classProperty', 'classMethod'],
			format: ['camelCase'],
		},
		{
			selector: ['classProperty', 'classMethod'],
			leadingUnderscore: 'allow',
			format: ['camelCase'],
		},
		{
			selector: ['classProperty', 'classMethod'],
			modifiers: ['private'],
			leadingUnderscore: 'allowDouble',
			trailingUnderscore: 'allowDouble',
			format: ['camelCase'],
		},
		{
			selector: 'typeProperty',
			format: null,
		},
		{
			selector: 'variable',
			modifiers: ['const', 'destructured'],
			format: null,
		},
		{
			selector: 'variable',
			modifiers: ['const', 'global'],
			types: ['function'],
			leadingUnderscore: 'allow',
			format: ['UPPER_CASE', 'camelCase'],
		},
		{
			selector: 'variable',
			modifiers: ['const', 'global'],
			leadingUnderscore: 'allow',
			format: ['UPPER_CASE'],
		},
		{
			selector: 'variable',
			modifiers: ['const', 'exported'],
			format: ['camelCase', 'UPPER_CASE'],
		},
		{
			selector: 'variableLike',
			format: ['camelCase'],
		},
		{ selector: 'interface', format: ['PascalCase'] },
		{
			selector: 'interface',
			modifiers: ['exported'],
			format: ['PascalCase'],
			prefix: ['I'],
		},
		{ selector: 'typeLike', format: ['PascalCase'] },
		{ selector: 'objectLiteralProperty', format: null },
		{ selector: 'default', format: ['camelCase'] },
		{
			selector: 'parameter',
			modifiers: ['unused'],
			format: ['camelCase'],
			leadingUnderscore: 'allow',
		},
		{
			selector: 'parameter',
			format: ['camelCase'],
		},
		{
			selector: 'enumMember',
			format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
		},
		{
			selector: 'enum',
			format: ['UPPER_CASE'],
		},
	] satisfies NamingConventionRule,
}

export default tsESLint.config(
	{
		ignores: IGNORE_PATTERNS,
	},
	...tsESLint.configs.stylisticTypeChecked,
	...svelteEslint.configs['flat/prettier'],
	{
		plugins: {
			'@typescript-eslint': tsESLint.plugin,
			svelte: svelteEslint,
			'check-file': checkFile,
		},
	},
	{
		rules: CUSTOM_RULES,
	},
	{
		languageOptions: {
			parser: tsESLint.parser,
			parserOptions: {
				project: './tsconfig.json',
				extraFileExtensions: ['.svelte'],
			},
			globals: {
				browser: true,
				node: true,
			},
		},
	},
	{
		files: ['**/*.svelte'],
		rules: {
			// Causes issues with Svelte and global types
			'no-undef': 'off',
			'@typescript-eslint/naming-convention': [
				'warn',
				{
					selector: 'variable',
					modifiers: ['exported'],
					format: ['camelCase'],
				},
				{
					selector: 'variable',
					modifiers: ['const', 'global'],
					format: ['UPPER_CASE'],
				},
				{
					selector: 'variable',
					modifiers: ['const', 'global'],
					types: ['function'],
					format: ['camelCase'],
				},
				{
					selector: 'variable',
					format: ['camelCase'],
					leadingUnderscore: 'allow',
				},
			] satisfies NamingConventionRule,
		},
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsESLint.parser,
				svelteConfig: svelteConfig,
				extraFileExtensions: ['.svelte'],
			},
			globals: {
				browser: true,
				node: true,
			},
		},
		settings: {
			ignoreWarnings: ['svelte/a11y-no-onchange', 'a11y-no-onchange'],
		},
	},
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: __dirname,
			},
		},
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
	}
)

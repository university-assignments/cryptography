import { globalIgnores } from 'eslint/config';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import pluginOxlint from 'eslint-plugin-oxlint';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfigWithVueTs(
	{
		name: 'app/files-to-lint',
		files: [ '**/*.{vue,ts,mts,tsx}' ],
	},

	globalIgnores([
		'**/dist/**',
		'**/dist-ssr/**',
		'**/coverage/**',
		'**/node_modules/**',
	]),

	...pluginVue.configs['flat/essential'],
	vueTsConfigs.recommended,

	...pluginOxlint.configs['flat/recommended'],

	{
		name: 'import-rules',
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							regex: '\\.ts$',
							message: 'Расширение .ts в импорте лишнее: moduleResolution bundler находит модуль сам.',
						},
					],
				},
			],
		},
	},

	{
		name: 'stylistic-rules',
		plugins: { '@stylistic': stylistic },
		extends: [ stylistic.configs.all ],
		rules: {
			'@stylistic/array-bracket-spacing': [
				'error',
				'always',
				{ objectsInArrays: false, arraysInArrays: false },
			],
			'@stylistic/array-element-newline': [ 'error', 'consistent' ],
			'@stylistic/brace-style': [ 'error', 'allman' ],
			'@stylistic/comma-dangle': [ 'error', 'always-multiline' ],
			'@stylistic/function-call-argument-newline': [ 'error', 'consistent' ],
			'@stylistic/indent': [ 'error', 'tab' ],
			'@stylistic/indent-binary-ops': [ 'error', 'tab' ],
			'@stylistic/padding-line-between-statements': [
				'error',
				{ blankLine: 'always', prev: 'import', next: '*' },
				{ blankLine: 'any', prev: 'import', next: 'import' },
			],
			'@stylistic/object-curly-newline': [
				'error',
				{
					ImportDeclaration: { multiline: true, minProperties: 4 },
					ExportDeclaration: { multiline: true, minProperties: 4 },
					ObjectExpression: { multiline: true, consistent: true },
					ObjectPattern: { multiline: true, consistent: true },
				},
			],
			'@stylistic/object-curly-spacing': [ 'error', 'always', { emptyObjects: 'never' }],
			'@stylistic/object-property-newline': [ 'error', { allowAllPropertiesOnSameLine: true }],
			'@stylistic/operator-linebreak': [ 'error', 'before' ],
			'@stylistic/padded-blocks': [ 'error', 'never' ],
			'@stylistic/quote-props': [ 'error', 'as-needed' ],
			'@stylistic/quotes': [ 'error', 'single' ],
		},
	},
);

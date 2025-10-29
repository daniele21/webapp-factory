module.exports = {
	root: true,
	env: {
		browser: true,
		es2022: true,
		node: true,
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	plugins: ['react', 'react-hooks', '@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:react/recommended',
		'plugin:react-hooks/recommended',
		'plugin:@typescript-eslint/recommended',
	],
	rules: {
		'react/react-in-jsx-scope': 'off',
		'react/prop-types': 'off',
		'react/no-unescaped-entities': 'off',
		'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
		'@typescript-eslint/no-explicit-any': 'off',
		'no-empty': 'off',
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
	ignorePatterns: ['dist/', 'dev-dist/', 'public/'],
}

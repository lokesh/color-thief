import stylisticTS from '@stylistic/eslint-plugin';

export default [
    {   
        plugins: {
            '@stylistic/ts': stylisticTS,
        },
        languageOptions: {
            ecmaVersion: 6,
            sourceType: 'module',
        },
        rules: {
            // Error prevention
            'prefer-const': 'error',
            'no-async-promise-executor': 'error',
            'no-cond-assign': 'error',
            'no-const-assign': 'error',
            'no-constant-condition': 'error',
            'no-debugger': 'error',
            'no-dupe-else-if': 'error',
            'no-dupe-keys': 'warn',
            'no-dupe-class-members': 'error',
            'no-dupe-args': 'error',
            'no-duplicate-case': 'error',
            'no-duplicate-imports': 'error',
            'no-empty-pattern': 'error',
            'no-fallthrough': 'error',
            'no-invalid-regexp': 'warn',
            'no-loss-of-precision': 'warn',
            'no-import-assign': 'error',
            'no-irregular-whitespace': 'error',
            'no-self-assign': 'error',
            'no-undef': 'warn',
            'no-unreachable': 'error',
            'no-unsafe-finally': 'error',
            'no-unsafe-negation': 'error',
            'no-unused-private-class-members': 'warn',
            'no-unused-vars': 'error',
            'no-use-before-define': 'error',
            
            // Style
            'arrow-body-style': [ 'error', 'always' ],
            'camelcase': 'warn',
            'curly': [ 'error', 'all' ],
            'eqeqeq': [ 'error', 'always' ],
            'func-style': [ 'error', 'expression' ],
            'no-array-constructor': 'error',
            'no-else-return': 'error',
            'no-empty': 'warn',
            'no-empty-static-block': 'warn',
            'no-eval': 'error',
            'no-implicit-coercion': 'error',
            'no-invalid-this': 'warn',
            'no-multi-assign': 'warn',
            'no-new': 'error',
            'no-redeclare': 'error',
            'no-script-url': 'error',
            'no-shadow': 'error',
            'no-shadow-restricted-names': 'error',
            'no-underscore-dangle': 'warn',
            'no-unused-expressions': 'warn',
            'no-useless-constructor': 'warn',
            'no-var': 'warn',
            'prefer-arrow-callback': 'error',
            'prefer-exponentiation-operator': 'warn',
            'prefer-numeric-literals': 'error',
            'require-await': 'warn',

            // Formatting
            // https://eslint.style/rules/js/array-bracket-newline
            // TODO: Finish up
            '@stylistic/ts/indent': [ 'error', 4 ]
        }
    }
]
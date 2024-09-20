// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        'plugins': {
            '@stylistic/js': stylistic,
            '@stylistic/ts': stylistic,
        },
        'rules': {
            // Formatting
            '@stylistic/js/array-bracket-newline': [ 'error', { 'multiline': true, 'minItems': 4 } ],
            '@stylistic/js/array-bracket-spacing': [ 'error', 'always' ],
            '@stylistic/js/array-element-newline': [ 'error', { 'multiline': true, 'minItems': 4 } ],
            '@stylistic/js/arrow-parens': [ 'error', 'always' ],
            '@stylistic/js/arrow-spacing': [ 'error', { 'before': true, 'after': true } ],
            '@stylistic/js/block-spacing': [ 'error', 'always' ],
            '@stylistic/js/brace-style': [ 'error', '1tbs' ],
            '@stylistic/js/comma-spacing': [ 'error', { 'before': false, 'after': true } ],
            '@stylistic/js/comma-style': [ 'error', 'last' ],
            '@stylistic/js/dot-location': [ 'error', 'property' ],
            '@stylistic/js/eol-last': [ 'error', 'always' ],
            '@stylistic/js/function-call-spacing': [ 'error', 'never' ],
            '@stylistic/js/implicit-arrow-linebreak': [ 'error', 'beside' ],
            '@stylistic/js/indent': [ 'error', 4 ],
            '@stylistic/js/key-spacing': [ 'error', { 'beforeColon': false, 'afterColon': true } ],
            '@stylistic/js/keyword-spacing': [ 'error', { 'before': true, 'after': true } ],
            '@stylistic/js/lines-between-class-members': [ 'error', 'always' ],
            '@stylistic/js/new-parens': [ 'error', 'always' ],
            '@stylistic/js/no-extra-parens': [ 'error', 'all' ],
            '@stylistic/js/no-extra-semi': 'error',
            '@stylistic/js/no-floating-decimal': 'error',
            '@stylistic/js/no-mixed-operators': 'error',
            '@stylistic/js/no-mixed-spaces-and-tabs': 'error',
            '@stylistic/js/no-multi-spaces': 'error',
            '@stylistic/js/no-trailing-spaces': 'error',
            '@stylistic/js/no-whitespace-before-property': 'error',
            '@stylistic/js/object-curly-newline': [ 'error', { 'multiline': true, 'minProperties': 3 } ],
            '@stylistic/js/object-curly-spacing': [ 'error', 'always' ],
            '@stylistic/js/one-var-declaration-per-line': 'error',
            '@stylistic/js/quote-props': [ 'error', 'always' ],
            '@stylistic/js/quotes': [ 'error', 'single' ],
            '@stylistic/js/rest-spread-spacing': [ 'error', 'never' ],
            '@stylistic/js/semi': [ 'error', 'always' ],
            '@stylistic/js/semi-spacing': [ 'error', { 'before': false, 'after': true } ],
            '@stylistic/js/semi-style': [ 'error', 'last' ],
            '@stylistic/js/space-before-blocks': [ 'error', 'always' ],
            '@stylistic/js/space-before-function-paren': [ 'error', 'always' ],
            '@stylistic/js/space-in-parens': [ 'error', 'always' ],
            '@stylistic/js/space-infix-ops': [ 'error', { 'int32Hint': false } ],
            '@stylistic/js/space-unary-ops': 'error',
            '@stylistic/js/spaced-comment': [ 'error', 'always' ],
            '@stylistic/js/switch-colon-spacing': 'error',
            '@stylistic/js/template-curly-spacing': [ 'error', 'always' ],
            '@stylistic/js/wrap-iife': [ 'error', 'inside' ],
            '@stylistic/js/wrap-regex': 'error',
            '@stylistic/ts/type-annotation-spacing': 'error',
        }
    }
);

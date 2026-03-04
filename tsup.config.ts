import { defineConfig } from 'tsup';
import type { Plugin } from 'esbuild';
import path from 'path';

/**
 * esbuild plugin that redirects resolve-loader.ts → resolve-loader.browser.ts
 * so the browser build never references the Node loader or sharp.
 */
const browserLoaderPlugin: Plugin = {
    name: 'browser-loader-resolve',
    setup(build) {
        build.onResolve({ filter: /resolve-loader\.js$/ }, (args) => {
            if (args.importer && !args.path.includes('.browser')) {
                const browserPath = path.resolve(
                    path.dirname(args.importer),
                    args.path
                        .replace('resolve-loader.js', 'resolve-loader.browser.ts'),
                );
                return { path: browserPath };
            }
            return undefined;
        });
    },
};

export default defineConfig([
    // Main library (ESM + CJS, used by both browser and Node)
    {
        entry: {
            index: 'src/index.ts',
            internals: 'src/internals.ts',
        },
        outDir: 'dist',
        format: ['esm', 'cjs'],
        splitting: false,
        dts: false,
        sourcemap: true,
        external: ['sharp'],
    },
    // Browser-specific builds (no sharp/Node loader references)
    {
        entry: {
            'index.browser': 'src/index.ts',
            'internals.browser': 'src/internals.browser.ts',
        },
        outDir: 'dist',
        format: ['esm', 'cjs'],
        splitting: false,
        dts: false,
        sourcemap: true,
        external: ['sharp'],
        esbuildPlugins: [browserLoaderPlugin],
    },
    // UMD/IIFE build for browsers (<script> tag)
    {
        entry: { 'color-thief': 'src/umd.ts' },
        outDir: 'dist/umd',
        format: ['iife'],
        globalName: 'ColorThief',
        sourcemap: true,
        platform: 'browser',
        external: ['sharp'],
        minify: true,
        esbuildPlugins: [browserLoaderPlugin],
        esbuildOptions(options) {
            options.external = [
                ...(options.external || []),
                'child_process', 'fs', 'path', 'os', 'crypto', 'stream',
                'util', 'http', 'https', 'zlib', 'events', 'buffer',
                'detect-libc',
            ];
        },
    },
    // Type declarations
    {
        entry: {
            index: 'src/index.ts',
            internals: 'src/internals.ts',
        },
        outDir: 'dist/types',
        format: ['esm', 'cjs'],
        dts: { only: true },
    },
    // Type declarations for browser internals
    {
        entry: {
            'internals.browser': 'src/internals.browser.ts',
        },
        outDir: 'dist/types',
        format: ['esm', 'cjs'],
        dts: { only: true },
    },
]);

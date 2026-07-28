import { defineConfig } from 'tsup';
import type { Plugin } from 'esbuild';
import path from 'path';

const wasmImportPlugin: Plugin = {
    name: 'wasm-import-resolve',
    setup(build) {
        build.onResolve({ filter: /^#color_thief_wasm$/ }, () => ({
            path: './wasm/color_thief_wasm.js',
            external: true,
        }));
    },
};

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
        esbuildPlugins: [wasmImportPlugin],
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
        esbuildPlugins: [browserLoaderPlugin, wasmImportPlugin],
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
    // CLI
    {
        entry: { cli: 'src/cli.ts' },
        outDir: 'dist',
        format: ['esm'],
        splitting: false,
        dts: false,
        sourcemap: false,
        external: ['sharp'],
        banner: { js: '#!/usr/bin/env node' },
    },
    // Copy only the wasm-pack runtime artifacts into the published package.
    {
        entry: [
            'src/wasm/pkg/color_thief_wasm.js',
            'src/wasm/pkg/color_thief_wasm.d.ts',
            'src/wasm/pkg/color_thief_wasm_bg.wasm',
        ],
        outDir: 'dist/wasm',
        format: ['esm'],
        bundle: false,
        splitting: false,
        dts: false,
        sourcemap: false,
        loader: {
            '.js': 'copy',
            '.d.ts': 'copy',
            '.wasm': 'copy',
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

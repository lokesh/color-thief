import { defineConfig } from 'tsup';

export default defineConfig([
    // Browser builds
    {
        entry: {
            index: 'src/index.ts',
            internals: 'src/internals.ts',
        },
        outDir: 'dist/browser',
        format: ['esm', 'cjs'],
        dts: false,
        sourcemap: true,
        platform: 'browser',
        external: ['sharp'],
        esbuildOptions(options) {
            options.conditions = ['browser'];
        },
    },
    // Node builds
    {
        entry: {
            index: 'src/index.ts',
            internals: 'src/internals.ts',
        },
        outDir: 'dist/node',
        format: ['esm', 'cjs'],
        dts: false,
        sourcemap: true,
        platform: 'node',
        external: ['sharp'],
    },
    // UMD/IIFE build for browsers
    {
        entry: { 'color-thief': 'src/umd.ts' },
        outDir: 'dist/umd',
        format: ['iife'],
        globalName: 'ColorThief',
        sourcemap: true,
        platform: 'browser',
        noExternal: [],
        external: ['sharp'],
        minify: true,
        esbuildOptions(options) {
            // Treat all Node built-ins as external so the IIFE doesn't
            // try to bundle sharp's transitive deps (detect-libc, etc.)
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
]);

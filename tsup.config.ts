import { defineConfig } from 'tsup';

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
]);

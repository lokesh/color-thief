// ---------------------------------------------------------------------------
// Package contents check
//
// Guards the class of bug behind #283: dist/ shipped an import of
// `dist/wasm/color_thief_wasm.js`, a file the published tarball never
// contained. Builds still worked — the dead code was tree-shaken — but every
// bundler resolving `colorthief/internals` printed an unresolvable-import
// warning, and nothing in CI noticed.
//
// Three assertions, all made against the file list npm would actually publish:
//   1. Every path package.json points at (exports, main, module, types, bin)
//      is in the tarball.
//   2. Every relative specifier emitted into dist/ resolves to a file in the
//      tarball.
//   3. The browser bundles carry no reference to sharp, the Node-only optional
//      peer dep.
//
// Reads dist/ as it stands on disk, so run it after `npm run build`.
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

const toPosix = (p) => p.split(path.sep).join('/');
const stripDotSlash = (p) => p.replace(/^\.\//, '');

// --- The file list npm would publish ---------------------------------------

const [packResult] = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json'], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
    }),
);
const packed = new Set(packResult.files.map((f) => f.path));

// --- 1. package.json entry points -------------------------------------------

// exports is a nested condition map, so walk it rather than reading fixed keys.
function collectPaths(value, out = []) {
    if (typeof value === 'string') {
        if (value.startsWith('./') || value.startsWith('dist/')) out.push(value);
    } else if (value && typeof value === 'object') {
        for (const nested of Object.values(value)) collectPaths(nested, out);
    }
    return out;
}

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const entryPoints = collectPaths([pkg.exports, pkg.main, pkg.module, pkg.types, pkg.bin]);

for (const entry of new Set(entryPoints.map(stripDotSlash))) {
    if (!packed.has(entry)) {
        errors.push(`package.json points at "${entry}", which the published tarball does not contain`);
    }
}

// --- 2. Relative specifiers emitted into dist/ ------------------------------

function walk(dir, out = []) {
    for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full, out);
        else out.push(full);
    }
    return out;
}

// Source maps embed the original sources, imports and all — scanning them would
// report specifiers that only ever existed pre-bundle.
const CODE_FILE = /\.(js|cjs|mjs|d\.ts|d\.cts|d\.mts)$/;
// Covers `from "x"` (static import and re-export), `import("x")`, `require("x")`,
// and the bare side-effect `import "x"`. The \0 delimiters cannot occur in real
// source, so a placeholder can never be confused for a genuine specifier.
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)"\0(\d+)\0"/g;

// Replace every comment with blanks and every string literal with an opaque
// placeholder, so the specifier regex only ever fires on real code. Both
// matter here: doc comments carry illustrative imports, and WasmQuantizer's
// "you must build this yourself" error message quotes an `import(...)` call
// inside a string. Neither is a reference a bundler would try to resolve.
function maskLiterals(code) {
    const values = [];
    let masked = '';
    let i = 0;

    // Distinguishes a regex literal from division by what precedes the slash —
    // the usual heuristic, and enough for generated bundles.
    const regexCanFollow = () => /[([{,;:=!&|?+\-*~^%<>]\s*$|^\s*$|\b(return|typeof|case|in|of|new|delete|void)\s*$/.test(masked);

    while (i < code.length) {
        const char = code[i];
        const pair = code.slice(i, i + 2);

        if (pair === '//' || pair === '/*') {
            const end = pair === '//'
                ? (code.indexOf('\n', i) === -1 ? code.length : code.indexOf('\n', i))
                : (code.indexOf('*/', i + 2) === -1 ? code.length : code.indexOf('*/', i + 2) + 2);
            // Keep newlines so line-comment handling stays sane on the next pass.
            masked += code.slice(i, end).replace(/[^\n]/g, ' ');
            i = end;
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            let j = i + 1;
            let value = '';
            while (j < code.length && code[j] !== char) {
                if (code[j] === '\\') {
                    value += code[j + 1] ?? '';
                    j += 2;
                    continue;
                }
                value += code[j];
                j += 1;
            }
            masked += `"\0${values.length}\0"`;
            values.push(value);
            i = j + 1;
            continue;
        }

        if (char === '/' && regexCanFollow()) {
            let j = i + 1;
            let inClass = false;
            while (j < code.length) {
                if (code[j] === '\\') { j += 2; continue; }
                if (code[j] === '[') inClass = true;
                else if (code[j] === ']') inClass = false;
                else if (code[j] === '/' && !inClass) break;
                else if (code[j] === '\n') break;
                j += 1;
            }
            masked += ' '.repeat(j - i + 1);
            i = j + 1;
            continue;
        }

        masked += char;
        i += 1;
    }

    return { masked, values };
}

// A .d.ts references its siblings by the .js specifier they will compile to;
// the file on disk is the matching declaration.
function resolutionCandidates(fromFile, specifier) {
    const target = toPosix(path.normalize(path.join(path.dirname(fromFile), specifier)));
    const candidates = [target];
    if (/\.d\.(ts|cts|mts)$/.test(fromFile)) {
        candidates.push(
            target.replace(/\.js$/, '.d.ts'),
            target.replace(/\.cjs$/, '.d.cts'),
            target.replace(/\.mjs$/, '.d.mts'),
        );
    }
    return candidates;
}

for (const file of walk(path.join(root, 'dist'))) {
    const rel = toPosix(path.relative(root, file));
    if (!CODE_FILE.test(rel) || !packed.has(rel)) continue;

    const { masked, values } = maskLiterals(readFileSync(file, 'utf8'));
    for (const [, index] of masked.matchAll(SPECIFIER)) {
        const specifier = values[Number(index)];
        if (!specifier.startsWith('.')) continue; // bare specifier — a dependency, not our file
        if (!resolutionCandidates(rel, specifier).some((c) => packed.has(c))) {
            errors.push(`${rel} imports "${specifier}", which the published tarball does not contain`);
        }
    }
}

// --- 3. No sharp in the browser bundles -------------------------------------

const BROWSER_BUNDLES = [
    'dist/index.browser.js',
    'dist/index.browser.cjs',
    'dist/internals.browser.js',
    'dist/internals.browser.cjs',
];

for (const rel of BROWSER_BUNDLES) {
    if (!packed.has(rel)) {
        errors.push(`expected browser bundle "${rel}" is missing from the published tarball`);
        continue;
    }
    if (/\bsharp\b/.test(readFileSync(path.join(root, rel), 'utf8'))) {
        errors.push(`${rel} references sharp — the browser build must not pull in the Node loader`);
    }
}

// --- Report -----------------------------------------------------------------

if (errors.length > 0) {
    console.error(`Package contents check failed (${errors.length}):\n`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
}

console.log(`Package contents OK — ${packed.size} files, all references resolve.`);

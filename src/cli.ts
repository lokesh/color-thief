import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { getColor, getPalette, getSwatches } from './api.js';
import type { Color, SwatchMap, SwatchRole } from './types.js';

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

// ---------------------------------------------------------------------------
// Help text
// ---------------------------------------------------------------------------

const HELP = `
Usage: colorthief [command] <file...> [options]

Commands:
  color      Extract dominant color (default)
  palette    Extract color palette
  swatches   Extract semantic swatches

Arguments:
  <file...>  Image file path(s). Use "-" for stdin.

Options:
  --json              Output as JSON
  --css               Output as CSS custom properties
  --count <n>         Number of palette colors (2-20, default 10)
  --quality <n>       Sampling quality (1=best, default 10)
  --color-space <s>   Color space: rgb or oklch (default oklch)
  -h, --help          Show this help
  -v, --version       Show version
`.trim();

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

type Command = 'color' | 'palette' | 'swatches';

interface CliArgs {
    command: Command;
    files: string[];
    json: boolean;
    css: boolean;
    count: number;
    quality: number;
    colorSpace: 'rgb' | 'oklch';
}

function parseCliArgs(argv: string[]): CliArgs {
    const { values, positionals } = parseArgs({
        args: argv.slice(2),
        options: {
            json: { type: 'boolean', default: false },
            css: { type: 'boolean', default: false },
            count: { type: 'string', default: '10' },
            quality: { type: 'string', default: '10' },
            'color-space': { type: 'string', default: 'oklch' },
            help: { type: 'boolean', short: 'h', default: false },
            version: { type: 'boolean', short: 'v', default: false },
        },
        allowPositionals: true,
        strict: true,
    });

    if (values.help) {
        console.log(HELP);
        process.exit(0);
    }

    if (values.version) {
        console.log(version);
        process.exit(0);
    }

    let command: Command = 'color';
    const files: string[] = [];

    for (const pos of positionals) {
        if (pos === 'color' || pos === 'palette' || pos === 'swatches') {
            if (files.length === 0) {
                command = pos;
                continue;
            }
        }
        files.push(pos);
    }

    if (files.length === 0) {
        // Check if stdin is piped
        if (!process.stdin.isTTY) {
            files.push('-');
        } else {
            console.error('Error: No input files specified.\n');
            console.log(HELP);
            process.exit(1);
        }
    }

    const count = parseInt(values.count as string, 10);
    if (isNaN(count) || count < 2 || count > 20) {
        console.error('Error: --count must be between 2 and 20.');
        process.exit(1);
    }

    const quality = parseInt(values.quality as string, 10);
    if (isNaN(quality) || quality < 1) {
        console.error('Error: --quality must be a positive integer.');
        process.exit(1);
    }

    const colorSpace = values['color-space'] as string;
    if (colorSpace !== 'rgb' && colorSpace !== 'oklch') {
        console.error('Error: --color-space must be "rgb" or "oklch".');
        process.exit(1);
    }

    return {
        command,
        files,
        json: values.json as boolean,
        css: values.css as boolean,
        count,
        quality,
        colorSpace,
    };
}

// ---------------------------------------------------------------------------
// Stdin reader
// ---------------------------------------------------------------------------

async function readStdin(): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const supportsColor = !process.env['NO_COLOR'] && process.stdout.isTTY;

function ansiSwatch(hex: string): string {
    if (!supportsColor) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `\x1b[38;2;${r};${g};${b}m\u2587\u2587\x1b[0m ${hex}`;
}

function colorToJson(c: Color): Record<string, unknown> {
    return {
        hex: c.hex(),
        rgb: c.rgb(),
        hsl: c.hsl(),
        oklch: c.oklch(),
        isDark: c.isDark,
        population: c.population,
        proportion: c.proportion,
    };
}

function swatchMapToJson(swatches: SwatchMap): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const role of Object.keys(swatches) as SwatchRole[]) {
        const s = swatches[role];
        result[role] = s ? colorToJson(s.color) : null;
    }
    return result;
}

// ---------------------------------------------------------------------------
// CSS output
// ---------------------------------------------------------------------------

function colorCss(c: Color): string {
    return `:root {\n    --color-dominant: ${c.hex()};\n}`;
}

function paletteCss(colors: Color[]): string {
    const props = colors.map((c, i) => `    --color-${i + 1}: ${c.hex()};`).join('\n');
    return `:root {\n${props}\n}`;
}

function swatchesCss(swatches: SwatchMap): string {
    const props: string[] = [];
    for (const role of Object.keys(swatches) as SwatchRole[]) {
        const s = swatches[role];
        const kebab = role.replace(/([A-Z])/g, '-$1').toLowerCase();
        props.push(`    --swatch${kebab}: ${s ? s.color.hex() : 'none'};`);
    }
    return `:root {\n${props.join('\n')}\n}`;
}

// ---------------------------------------------------------------------------
// ANSI output
// ---------------------------------------------------------------------------

function colorAnsi(c: Color): string {
    return ansiSwatch(c.hex());
}

function paletteAnsi(colors: Color[]): string {
    return colors.map(c => ansiSwatch(c.hex())).join('\n');
}

function swatchesAnsi(swatches: SwatchMap): string {
    const lines: string[] = [];
    for (const role of Object.keys(swatches) as SwatchRole[]) {
        const s = swatches[role];
        const label = role.padEnd(14);
        lines.push(s ? `${label} ${ansiSwatch(s.color.hex())}` : `${label} —`);
    }
    return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function processFile(
    source: string | Buffer,
    args: CliArgs,
): Promise<{ colorResult?: Color | null; paletteResult?: Color[] | null; swatchResult?: SwatchMap }> {
    const opts = {
        colorCount: args.count,
        quality: args.quality,
        colorSpace: args.colorSpace as 'rgb' | 'oklch',
    };

    switch (args.command) {
        case 'color': {
            const color = await getColor(source, opts);
            return { colorResult: color };
        }
        case 'palette': {
            const palette = await getPalette(source, opts);
            return { paletteResult: palette };
        }
        case 'swatches': {
            const swatches = await getSwatches(source, opts);
            return { swatchResult: swatches };
        }
    }
}

function formatResult(
    result: Awaited<ReturnType<typeof processFile>>,
    args: CliArgs,
): string {
    if (args.json) {
        if (result.colorResult !== undefined) {
            return JSON.stringify(result.colorResult ? colorToJson(result.colorResult) : null, null, 2);
        }
        if (result.paletteResult !== undefined) {
            return JSON.stringify(result.paletteResult ? result.paletteResult.map(colorToJson) : null, null, 2);
        }
        if (result.swatchResult !== undefined) {
            return JSON.stringify(swatchMapToJson(result.swatchResult), null, 2);
        }
    }

    if (args.css) {
        if (result.colorResult !== undefined && result.colorResult) {
            return colorCss(result.colorResult);
        }
        if (result.paletteResult !== undefined && result.paletteResult) {
            return paletteCss(result.paletteResult);
        }
        if (result.swatchResult !== undefined) {
            return swatchesCss(result.swatchResult!);
        }
    }

    // Default ANSI
    if (result.colorResult !== undefined) {
        return result.colorResult ? colorAnsi(result.colorResult) : '(no color found)';
    }
    if (result.paletteResult !== undefined) {
        return result.paletteResult ? paletteAnsi(result.paletteResult) : '(no palette found)';
    }
    if (result.swatchResult !== undefined) {
        return swatchesAnsi(result.swatchResult);
    }

    return '';
}

async function main(): Promise<void> {
    const args = parseCliArgs(process.argv);
    const multiFile = args.files.length > 1;

    if (args.json && multiFile) {
        const combined: Record<string, unknown> = {};
        for (const file of args.files) {
            const source = file === '-' ? await readStdin() : file;
            const label = file === '-' ? 'stdin' : file;
            const result = await processFile(source, args);

            if (result.colorResult !== undefined) {
                combined[label] = result.colorResult ? colorToJson(result.colorResult) : null;
            } else if (result.paletteResult !== undefined) {
                combined[label] = result.paletteResult ? result.paletteResult.map(colorToJson) : null;
            } else if (result.swatchResult !== undefined) {
                combined[label] = swatchMapToJson(result.swatchResult);
            }
        }
        console.log(JSON.stringify(combined, null, 2));
        return;
    }

    for (const file of args.files) {
        const source = file === '-' ? await readStdin() : file;
        const result = await processFile(source, args);
        const output = formatResult(result, args);

        if (multiFile) {
            const label = file === '-' ? 'stdin' : file;
            console.log(`${label}:`);
        }
        console.log(output);
    }
}

main().catch((err) => {
    if (
        err?.code === 'ERR_MODULE_NOT_FOUND' ||
        err?.code === 'MODULE_NOT_FOUND' ||
        (typeof err?.message === 'string' && err.message.includes('Cannot find module') && err.message.includes('sharp'))
    ) {
        console.error(
            'Error: sharp is required for image decoding but was not found.\n\n' +
            'Install it alongside colorthief:\n\n' +
            '  npm install -g colorthief sharp\n'
        );
        process.exit(1);
    }
    console.error(err.message || err);
    process.exit(1);
});

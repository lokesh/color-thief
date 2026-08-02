import { resolve } from 'path';
import { execFile } from 'child_process';
import { readFileSync } from 'fs';
import { promisify } from 'util';
import chai from 'chai';

const expect = chai.expect;
const execFileAsync = promisify(execFile);

const cli = resolve(process.cwd(), 'dist/cli.js');
const imgDir = resolve(process.cwd(), 'cypress/test-pages/img');
const img = (name) => resolve(imgDir, name);

function run(...args) {
    return execFileAsync('node', [cli, ...args], { timeout: 15000 });
}

function runWithStdin(filePath, ...args) {
    return new Promise((resolve, reject) => {
        const child = execFile('node', [cli, ...args], { timeout: 15000 }, (err, stdout, stderr) => {
            if (err) reject(err);
            else resolve({ stdout, stderr });
        });
        const data = readFileSync(filePath);
        child.stdin.write(data);
        child.stdin.end();
    });
}

// ===========================================================================
// CLI
// ===========================================================================

describe('CLI', function () {
    this.timeout(15000);

    // -----------------------------------------------------------------------
    // --help / --version
    // -----------------------------------------------------------------------

    it('--help shows usage', async function () {
        const { stdout } = await run('--help');
        expect(stdout).to.include('Usage:');
        expect(stdout).to.include('colorthief');
    });

    it('-h shows usage', async function () {
        const { stdout } = await run('-h');
        expect(stdout).to.include('Usage:');
    });

    it('--version shows version', async function () {
        const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
        const { stdout } = await run('--version');
        expect(stdout.trim()).to.equal(pkg.version);
    });

    it('-v shows version', async function () {
        const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
        const { stdout } = await run('-v');
        expect(stdout.trim()).to.equal(pkg.version);
    });

    // -----------------------------------------------------------------------
    // color (default command)
    // -----------------------------------------------------------------------

    it('outputs hex for dominant color', async function () {
        const { stdout } = await run(img('red.png'));
        expect(stdout).to.match(/#[0-9a-f]{6}/i);
    });

    it('dominant color of red.png is close to red', async function () {
        const { stdout } = await run(img('red.png'), '--json');
        const data = JSON.parse(stdout);
        expect(data.rgb.r).to.be.greaterThan(200);
        expect(data.rgb.g).to.be.lessThan(50);
        expect(data.rgb.b).to.be.lessThan(50);
    });

    // -----------------------------------------------------------------------
    // --json
    // -----------------------------------------------------------------------

    it('--json returns valid JSON with expected fields', async function () {
        const { stdout } = await run(img('red.png'), '--json');
        const data = JSON.parse(stdout);
        expect(data).to.have.property('hex');
        expect(data).to.have.property('rgb');
        expect(data).to.have.property('hsl');
        expect(data).to.have.property('oklch');
        expect(data).to.have.property('isDark');
        expect(data).to.have.property('population');
        expect(data).to.have.property('proportion');
    });

    // -----------------------------------------------------------------------
    // palette
    // -----------------------------------------------------------------------

    it('palette subcommand returns array in JSON mode', async function () {
        const { stdout } = await run('palette', img('rainbow-horizontal.png'), '--json');
        const data = JSON.parse(stdout);
        expect(data).to.be.an('array');
        expect(data.length).to.be.greaterThan(1);
        expect(data[0]).to.have.property('hex');
    });

    it('palette --count limits colors', async function () {
        const { stdout } = await run('palette', img('rainbow-horizontal.png'), '--json', '--count', '3');
        const data = JSON.parse(stdout);
        expect(data).to.be.an('array');
        expect(data.length).to.be.at.most(3);
    });

    it('palette default output shows hex values', async function () {
        const { stdout } = await run('palette', img('rainbow-horizontal.png'));
        const hexes = stdout.match(/#[0-9a-f]{6}/gi);
        expect(hexes).to.not.be.null;
        expect(hexes.length).to.be.greaterThan(1);
    });

    // -----------------------------------------------------------------------
    // swatches
    // -----------------------------------------------------------------------

    it('swatches returns all roles in JSON', async function () {
        const { stdout } = await run('swatches', img('rainbow-horizontal.png'), '--json');
        const data = JSON.parse(stdout);
        const expectedRoles = ['Vibrant', 'Muted', 'DarkVibrant', 'DarkMuted', 'LightVibrant', 'LightMuted'];
        for (const role of expectedRoles) {
            expect(data).to.have.property(role);
        }
    });

    it('swatches default output shows role names', async function () {
        const { stdout } = await run('swatches', img('rainbow-horizontal.png'));
        expect(stdout).to.include('Vibrant');
        expect(stdout).to.include('Muted');
    });

    // -----------------------------------------------------------------------
    // --css
    // -----------------------------------------------------------------------

    it('--css for color outputs custom properties', async function () {
        const { stdout } = await run(img('red.png'), '--css');
        expect(stdout).to.include(':root');
        expect(stdout).to.include('--color-dominant');
    });

    it('--css for palette outputs numbered properties', async function () {
        const { stdout } = await run('palette', img('rainbow-horizontal.png'), '--css');
        expect(stdout).to.include(':root');
        expect(stdout).to.include('--color-1');
    });

    it('--css for swatches outputs swatch properties', async function () {
        const { stdout } = await run('swatches', img('rainbow-horizontal.png'), '--css');
        expect(stdout).to.include(':root');
        expect(stdout).to.include('--swatch-vibrant');
        expect(stdout).to.include('--swatch-dark-muted');
    });

    // -----------------------------------------------------------------------
    // stdin
    // -----------------------------------------------------------------------

    it('reads from stdin with "-" argument', async function () {
        const { stdout } = await runWithStdin(img('red.png'), '-', '--json');
        const data = JSON.parse(stdout);
        expect(data).to.have.property('hex');
        expect(data.rgb.r).to.be.greaterThan(200);
    });

    // -----------------------------------------------------------------------
    // multi-file
    // -----------------------------------------------------------------------

    it('multi-file JSON wraps in object keyed by filename', async function () {
        const { stdout } = await run(img('red.png'), img('black.png'), '--json');
        const data = JSON.parse(stdout);
        expect(data).to.have.property(img('red.png'));
        expect(data).to.have.property(img('black.png'));
    });

    it('multi-file default output prefixes with filename', async function () {
        const { stdout } = await run(img('red.png'), img('black.png'));
        expect(stdout).to.include('red.png:');
        expect(stdout).to.include('black.png:');
    });

    // -----------------------------------------------------------------------
    // --color-space
    // -----------------------------------------------------------------------

    it('--color-space rgb works', async function () {
        const { stdout } = await run(img('red.png'), '--json', '--color-space', 'rgb');
        const data = JSON.parse(stdout);
        expect(data).to.have.property('hex');
    });

    // -----------------------------------------------------------------------
    // --region
    // -----------------------------------------------------------------------

    it('--region restricts extraction to the given rectangle', async function () {
        // rainbow-horizontal.png is warm red/orange at the top, magenta at the
        // bottom, so the two strips must not agree.
        const top = await run(img('rainbow-horizontal.png'), '--json', '--region', '0,0,1,0.1');
        const bottom = await run(img('rainbow-horizontal.png'), '--json', '--region', '0,0.9,1,0.1');
        const topColor = JSON.parse(top.stdout);
        const bottomColor = JSON.parse(bottom.stdout);

        expect(topColor.hex).to.not.equal(bottomColor.hex);
        expect(topColor.rgb.b).to.be.lessThan(60);
        expect(bottomColor.rgb.b).to.be.greaterThan(150);
    });

    it('--region tolerates spaces between values', async function () {
        const { stdout } = await run(img('red.png'), '--json', '--region', '0, 0, 1, 0.5');
        expect(JSON.parse(stdout).rgb.r).to.be.greaterThan(200);
    });

    it('--region works with the palette command', async function () {
        const { stdout } = await run(
            'palette', img('rainbow-horizontal.png'), '--json', '--count', '3', '--region', '0,0,1,0.2',
        );
        const palette = JSON.parse(stdout);
        expect(palette).to.be.an('array');
        expect(palette.length).to.be.greaterThan(0);
    });

    it('--region works with the swatches command', async function () {
        const { stdout } = await run(
            'swatches', img('rainbow-horizontal.png'), '--json', '--region', '0,0,1,0.2',
        );
        expect(JSON.parse(stdout)).to.have.property('Vibrant');
    });

    it('a full-image --region matches the default output', async function () {
        const plain = await run(img('rainbow-horizontal.png'), '--json');
        const full = await run(img('rainbow-horizontal.png'), '--json', '--region', '0,0,1,1');
        expect(JSON.parse(full.stdout).hex).to.equal(JSON.parse(plain.stdout).hex);
    });

    it('--help documents --region', async function () {
        const { stdout } = await run('--help');
        expect(stdout).to.include('--region');
    });

    it('exits with an error for a malformed --region', async function () {
        try {
            await run(img('red.png'), '--region', '0,0');
            expect.fail('should have thrown');
        } catch (err) {
            expect(err.code).to.not.equal(0);
            expect(err.stderr).to.include('x,y,width,height');
        }
    });

    it('exits with an error for non-numeric --region values', async function () {
        try {
            await run(img('red.png'), '--region', '0,0,half,1');
            expect.fail('should have thrown');
        } catch (err) {
            expect(err.code).to.not.equal(0);
            expect(err.stderr).to.include('x,y,width,height');
        }
    });

    it('exits with an error for out-of-range --region values', async function () {
        try {
            await run(img('red.png'), '--region', '0,0,2,1');
            expect.fail('should have thrown');
        } catch (err) {
            expect(err.code).to.not.equal(0);
            expect(err.stderr).to.include('region.width');
        }
    });

    // -----------------------------------------------------------------------
    // error cases
    // -----------------------------------------------------------------------

    it('exits with error for missing file', async function () {
        try {
            await run('nonexistent.png');
            expect.fail('should have thrown');
        } catch (err) {
            expect(err.code).to.not.equal(0);
        }
    });
});

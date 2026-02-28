import type { NodeSource, PixelData, PixelLoader } from '../types.js';

/** Custom decoder signature for pluggable Node decoders. */
export type NodeImageDecoder = (
    input: string | Buffer,
) => Promise<{ data: Uint8Array; width: number; height: number }>;

interface NodeLoaderOptions {
    /** Override the default sharp-based decoder. */
    decoder?: NodeImageDecoder;
}

/**
 * Node.js pixel loader. Uses `sharp` (dynamically imported) to decode images
 * into raw RGBA pixel buffers. Accepts file paths or Buffers.
 *
 * The sharp dependency is optional — use `createNodeLoader({ decoder })`
 * to supply a custom decoder if sharp is not available.
 */
export class NodePixelLoader implements PixelLoader<NodeSource> {
    private readonly decoder: NodeImageDecoder;

    constructor(options?: NodeLoaderOptions) {
        this.decoder = options?.decoder ?? defaultSharpDecoder;
    }

    async load(source: NodeSource): Promise<PixelData> {
        const result = await this.decoder(source);
        return {
            data: result.data,
            width: result.width,
            height: result.height,
        };
    }
}

/** Default decoder using sharp. Dynamically imports sharp so it stays optional. */
async function defaultSharpDecoder(
    input: string | Buffer,
): Promise<{ data: Uint8Array; width: number; height: number }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sharpFn: any;
    try {
        const mod = await import('sharp');
        sharpFn = mod.default ?? mod;
    } catch {
        throw new Error(
            'sharp is required for Node.js image loading. Install it with: npm install sharp',
        );
    }
    const image = sharpFn(input).ensureAlpha();
    const { width, height } = await image.metadata();
    if (!width || !height) {
        throw new Error('Could not determine image dimensions.');
    }
    const { data } = await image.raw().toBuffer({ resolveWithObject: true });
    return { data: new Uint8Array(data.buffer, data.byteOffset, data.byteLength), width, height };
}

/** Factory to create a NodePixelLoader with optional custom decoder. */
export function createNodeLoader(options?: NodeLoaderOptions): NodePixelLoader {
    return new NodePixelLoader(options);
}

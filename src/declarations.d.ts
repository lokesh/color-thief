declare module '@lokesh.dhakar/quantize' {
    type RGBTuple = [number, number, number];
    interface ColorMap {
        palette(): RGBTuple[];
        map(color: RGBTuple): RGBTuple;
    }
    function quantize(
        pixels: RGBTuple[],
        maxColors: number,
    ): ColorMap | null;
    export default quantize;
}

declare module 'sharp' {
    interface SharpInstance {
        ensureAlpha(): SharpInstance;
        raw(): SharpInstance;
        metadata(): Promise<{ width?: number; height?: number; format?: string }>;
        toBuffer(options?: { resolveWithObject: true }): Promise<{
            data: Buffer;
            info: { width: number; height: number };
        }>;
        toBuffer(): Promise<Buffer>;
    }
    function sharp(input: string | Buffer): SharpInstance;
    export default sharp;
}

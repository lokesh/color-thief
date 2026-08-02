/**
 * One-time deprecation warnings.
 *
 * Each distinct message is logged at most once per module instance so a
 * deprecated call inside a render loop or an `observe()` callback can't flood
 * the console.
 */

const warned = new Set<string>();

/** Log a deprecation warning once per distinct message. */
export function deprecate(message: string): void {
    if (warned.has(message)) return;
    warned.add(message);
    // eslint-disable-next-line no-console
    console.warn(`[colorthief] Deprecation: ${message}`);
}

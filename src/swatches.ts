import type { Color, Swatch, SwatchMap, SwatchRole } from './types.js';
import { createColor } from './color.js';

// ---------------------------------------------------------------------------
// OKLCH target ranges for each swatch role
// ---------------------------------------------------------------------------

interface SwatchTarget {
    role: SwatchRole;
    /** Target OKLCH lightness (0–1). */
    targetL: number;
    /** Min / max lightness. */
    minL: number;
    maxL: number;
    /** Target chroma (0–0.4). */
    targetC: number;
    /** Min chroma. */
    minC: number;
}

const TARGETS: SwatchTarget[] = [
    { role: 'Vibrant',      targetL: 0.65, minL: 0.40, maxL: 0.85, targetC: 0.20, minC: 0.08 },
    { role: 'Muted',        targetL: 0.65, minL: 0.40, maxL: 0.85, targetC: 0.04, minC: 0.00 },
    { role: 'DarkVibrant',  targetL: 0.30, minL: 0.00, maxL: 0.45, targetC: 0.20, minC: 0.08 },
    { role: 'DarkMuted',    targetL: 0.30, minL: 0.00, maxL: 0.45, targetC: 0.04, minC: 0.00 },
    { role: 'LightVibrant', targetL: 0.85, minL: 0.70, maxL: 1.00, targetC: 0.20, minC: 0.08 },
    { role: 'LightMuted',   targetL: 0.85, minL: 0.70, maxL: 1.00, targetC: 0.04, minC: 0.00 },
];

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

const WEIGHT_L = 6;
const WEIGHT_C = 3;
const WEIGHT_POP = 1;

function score(
    color: Color,
    target: SwatchTarget,
    maxPopulation: number,
): number {
    const { l, c } = color.oklch();

    // Out of lightness range → disqualified
    if (l < target.minL || l > target.maxL) return -Infinity;
    // Below minimum chroma → disqualified
    if (c < target.minC) return -Infinity;

    const lDist = 1 - Math.abs(l - target.targetL);
    const cDist = 1 - Math.min(Math.abs(c - target.targetC) / 0.2, 1);
    const pop = maxPopulation > 0 ? color.population / maxPopulation : 0;

    return lDist * WEIGHT_L + cDist * WEIGHT_C + pop * WEIGHT_POP;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const WHITE = createColor(255, 255, 255, 0);
const BLACK = createColor(0, 0, 0, 0);

function textColors(color: Color): { title: Color; body: Color } {
    return {
        title: color.isDark ? WHITE : BLACK,
        body: color.isDark ? WHITE : BLACK,
    };
}

/**
 * Classify a palette into semantic swatch roles using OKLCH distance scoring.
 * Each role is matched to the best-scoring palette color. A color can only
 * be assigned to one role (the one where it scores highest).
 */
export function classifySwatches(palette: Color[]): SwatchMap {
    const maxPopulation = Math.max(...palette.map((c) => c.population), 1);

    // Score every (color, target) pair
    const assignments: Array<{
        role: SwatchRole;
        color: Color;
        score: number;
    }> = [];

    for (const target of TARGETS) {
        let bestColor: Color | null = null;
        let bestScore = -Infinity;

        for (const color of palette) {
            const s = score(color, target, maxPopulation);
            if (s > bestScore) {
                bestScore = s;
                bestColor = color;
            }
        }

        if (bestColor && bestScore > -Infinity) {
            assignments.push({ role: target.role, color: bestColor, score: bestScore });
        }
    }

    // Resolve conflicts: if the same color is best for multiple roles,
    // keep the role where it scored highest; re-pick the loser.
    const used = new Set<Color>();
    const result: Partial<SwatchMap> = {};

    // Sort assignments by score descending so highest-scoring role wins
    assignments.sort((a, b) => b.score - a.score);

    for (const assignment of assignments) {
        if (used.has(assignment.color)) {
            // Try to find next best unused color for this role
            const target = TARGETS.find((t) => t.role === assignment.role)!;
            let fallback: Color | null = null;
            let fallbackScore = -Infinity;
            for (const color of palette) {
                if (used.has(color)) continue;
                const s = score(color, target, maxPopulation);
                if (s > fallbackScore) {
                    fallbackScore = s;
                    fallback = color;
                }
            }
            if (fallback && fallbackScore > -Infinity) {
                used.add(fallback);
                const { title, body } = textColors(fallback);
                result[assignment.role] = {
                    color: fallback,
                    role: assignment.role,
                    titleTextColor: title,
                    bodyTextColor: body,
                };
            } else {
                result[assignment.role] = null;
            }
        } else {
            used.add(assignment.color);
            const { title, body } = textColors(assignment.color);
            result[assignment.role] = {
                color: assignment.color,
                role: assignment.role,
                titleTextColor: title,
                bodyTextColor: body,
            };
        }
    }

    // Fill any unassigned roles with null
    for (const target of TARGETS) {
        if (!(target.role in result)) {
            result[target.role] = null;
        }
    }

    return result as SwatchMap;
}

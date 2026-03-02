use wasm_bindgen::prelude::*;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SIGBITS: u32 = 5;
const RSHIFT: u32 = 8 - SIGBITS;
const HIST_SIZE: usize = 1 << (3 * SIGBITS); // 32768
const MAX_ITERATIONS: usize = 1000;
const FRACT_BY_POPULATION: f64 = 0.75;

// ---------------------------------------------------------------------------
// 3D Color Histogram
// ---------------------------------------------------------------------------

fn color_index(r: u32, g: u32, b: u32) -> usize {
    ((r << (2 * SIGBITS)) + (g << SIGBITS) + b) as usize
}

fn build_histogram(pixels: &[u8]) -> (Vec<u32>, usize) {
    let mut hist = vec![0u32; HIST_SIZE];
    let num_pixels = pixels.len() / 3;

    for i in 0..num_pixels {
        let r = (pixels[i * 3] as u32) >> RSHIFT;
        let g = (pixels[i * 3 + 1] as u32) >> RSHIFT;
        let b = (pixels[i * 3 + 2] as u32) >> RSHIFT;
        hist[color_index(r, g, b)] += 1;
    }

    (hist, num_pixels)
}

// ---------------------------------------------------------------------------
// VBox — a box in 5-bit quantized RGB space
// ---------------------------------------------------------------------------

#[derive(Clone)]
struct VBox {
    r_min: u32,
    r_max: u32,
    g_min: u32,
    g_max: u32,
    b_min: u32,
    b_max: u32,
    count: u32,
    volume: u32,
}

impl VBox {
    fn from_pixels(pixels: &[u8]) -> Self {
        let mut r_min = 255u32;
        let mut r_max = 0u32;
        let mut g_min = 255u32;
        let mut g_max = 0u32;
        let mut b_min = 255u32;
        let mut b_max = 0u32;

        let num_pixels = pixels.len() / 3;
        for i in 0..num_pixels {
            let r = (pixels[i * 3] as u32) >> RSHIFT;
            let g = (pixels[i * 3 + 1] as u32) >> RSHIFT;
            let b = (pixels[i * 3 + 2] as u32) >> RSHIFT;
            r_min = r_min.min(r);
            r_max = r_max.max(r);
            g_min = g_min.min(g);
            g_max = g_max.max(g);
            b_min = b_min.min(b);
            b_max = b_max.max(b);
        }

        VBox {
            r_min, r_max, g_min, g_max, b_min, b_max,
            count: 0,
            volume: 0,
        }
    }

    fn update_count(&mut self, hist: &[u32]) {
        let mut count = 0u32;
        for r in self.r_min..=self.r_max {
            for g in self.g_min..=self.g_max {
                for b in self.b_min..=self.b_max {
                    count += hist[color_index(r, g, b)];
                }
            }
        }
        self.count = count;
    }

    fn update_volume(&mut self) {
        self.volume = (self.r_max - self.r_min + 1)
            * (self.g_max - self.g_min + 1)
            * (self.b_max - self.b_min + 1);
    }

    fn avg_color(&self, hist: &[u32]) -> (u8, u8, u8, u32) {
        let mut r_sum = 0u64;
        let mut g_sum = 0u64;
        let mut b_sum = 0u64;
        let mut total = 0u64;

        for r in self.r_min..=self.r_max {
            for g in self.g_min..=self.g_max {
                for b in self.b_min..=self.b_max {
                    let h = hist[color_index(r, g, b)] as u64;
                    if h > 0 {
                        total += h;
                        r_sum += h * ((r << RSHIFT) + (1 << (RSHIFT - 1))) as u64;
                        g_sum += h * ((g << RSHIFT) + (1 << (RSHIFT - 1))) as u64;
                        b_sum += h * ((b << RSHIFT) + (1 << (RSHIFT - 1))) as u64;
                    }
                }
            }
        }

        if total == 0 {
            let r = ((self.r_min + self.r_max + 1) << RSHIFT) / 2;
            let g = ((self.g_min + self.g_max + 1) << RSHIFT) / 2;
            let b = ((self.b_min + self.b_max + 1) << RSHIFT) / 2;
            return (r.min(255) as u8, g.min(255) as u8, b.min(255) as u8, 0);
        }

        (
            (r_sum / total).min(255) as u8,
            (g_sum / total).min(255) as u8,
            (b_sum / total).min(255) as u8,
            total as u32,
        )
    }

    fn widest_dimension(&self) -> u8 {
        let r_range = self.r_max - self.r_min;
        let g_range = self.g_max - self.g_min;
        let b_range = self.b_max - self.b_min;
        if r_range >= g_range && r_range >= b_range { 0 }
        else if g_range >= r_range && g_range >= b_range { 1 }
        else { 2 }
    }
}

// ---------------------------------------------------------------------------
// Median cut
// ---------------------------------------------------------------------------

fn median_cut(hist: &[u32], vbox: &VBox) -> Option<(VBox, VBox)> {
    if vbox.count <= 1 {
        return None;
    }

    let dim = vbox.widest_dimension();

    // Build partial sums along the widest dimension
    let (range_min, range_max) = match dim {
        0 => (vbox.r_min, vbox.r_max),
        1 => (vbox.g_min, vbox.g_max),
        _ => (vbox.b_min, vbox.b_max),
    };

    if range_min == range_max {
        return None;
    }

    let mut partial_sum = vec![0i64; (range_max + 1) as usize];
    let mut total = 0i64;

    for i in range_min..=range_max {
        let mut sum = 0i64;
        match dim {
            0 => {
                for g in vbox.g_min..=vbox.g_max {
                    for b in vbox.b_min..=vbox.b_max {
                        sum += hist[color_index(i, g, b)] as i64;
                    }
                }
            }
            1 => {
                for r in vbox.r_min..=vbox.r_max {
                    for b in vbox.b_min..=vbox.b_max {
                        sum += hist[color_index(r, i, b)] as i64;
                    }
                }
            }
            _ => {
                for r in vbox.r_min..=vbox.r_max {
                    for g in vbox.g_min..=vbox.g_max {
                        sum += hist[color_index(r, g, i)] as i64;
                    }
                }
            }
        }
        total += sum;
        partial_sum[i as usize] = total;
    }

    // Find the split point
    for i in range_min..=range_max {
        if partial_sum[i as usize] > total / 2 {
            let left = i - range_min;
            let right = range_max - i;
            let cut = if left <= right {
                (i + right / 2).min(range_max - 1)
            } else {
                (i - 1 - left / 2).max(range_min)
            };

            let mut vbox1 = vbox.clone();
            let mut vbox2 = vbox.clone();

            match dim {
                0 => { vbox1.r_max = cut; vbox2.r_min = cut + 1; }
                1 => { vbox1.g_max = cut; vbox2.g_min = cut + 1; }
                _ => { vbox1.b_max = cut; vbox2.b_min = cut + 1; }
            }

            vbox1.update_count(hist);
            vbox1.update_volume();
            vbox2.update_count(hist);
            vbox2.update_volume();

            return Some((vbox1, vbox2));
        }
    }

    None
}

// ---------------------------------------------------------------------------
// Priority queue (sort by comparator, split largest)
// ---------------------------------------------------------------------------

fn iterate(
    queue: &mut Vec<VBox>,
    hist: &[u32],
    target: usize,
    compare_by_product: bool,
) {
    let mut n_iters = 0;

    loop {
        if compare_by_product {
            queue.sort_by(|a, b| {
                let pa = (a.count as u64) * (a.volume as u64);
                let pb = (b.count as u64) * (b.volume as u64);
                pa.cmp(&pb)
            });
        } else {
            queue.sort_by(|a, b| a.count.cmp(&b.count));
        }

        if queue.is_empty() {
            return;
        }

        let vbox = queue.pop().unwrap();

        if vbox.count == 0 {
            queue.push(vbox);
            return;
        }

        if let Some((vbox1, vbox2)) = median_cut(hist, &vbox) {
            queue.push(vbox1);
            if vbox2.count > 0 {
                queue.push(vbox2);
            }
        } else {
            queue.push(vbox);
            return;
        }

        if queue.len() >= target {
            return;
        }

        n_iters += 1;
        if n_iters >= MAX_ITERATIONS {
            return;
        }
    }
}

// ---------------------------------------------------------------------------
// WASM entry point
// ---------------------------------------------------------------------------

/// Quantize pixel data (flat [r,g,b,r,g,b,...]) into a palette.
/// Returns flat [r, g, b, population(u8,u8,u8,u8 LE), ...] — 7 bytes per color.
/// We encode population as 4 little-endian bytes for simplicity.
#[wasm_bindgen]
pub fn quantize(pixels: &[u8], max_colors: usize) -> Vec<u8> {
    if pixels.is_empty() || max_colors == 0 {
        return Vec::new();
    }

    let (hist, _num_pixels) = build_histogram(pixels);
    let mut initial_box = VBox::from_pixels(pixels);
    initial_box.update_count(&hist);
    initial_box.update_volume();

    let mut queue = vec![initial_box];

    // Phase 1: split by population until 75% of target
    let target1 = ((max_colors as f64) * FRACT_BY_POPULATION).ceil() as usize;
    iterate(&mut queue, &hist, target1, false);

    // Phase 2: split by population * volume for the rest
    iterate(&mut queue, &hist, max_colors, true);

    // Build output: 7 bytes per color (r, g, b, pop_le[4])
    let mut result = Vec::with_capacity(queue.len() * 7);
    for vbox in &queue {
        let (r, g, b, pop) = vbox.avg_color(&hist);
        result.push(r);
        result.push(g);
        result.push(b);
        result.extend_from_slice(&pop.to_le_bytes());
    }

    result
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_single_color() {
        // 100 red pixels
        let pixels: Vec<u8> = (0..100).flat_map(|_| vec![255, 0, 0]).collect();
        let result = quantize(&pixels, 2);
        assert!(!result.is_empty());
        // First color should be near red
        assert!(result[0] > 200); // r
        assert!(result[1] < 50);  // g
        assert!(result[2] < 50);  // b
    }

    #[test]
    fn test_two_colors() {
        let mut pixels = Vec::new();
        for _ in 0..50 { pixels.extend_from_slice(&[255, 0, 0]); }
        for _ in 0..50 { pixels.extend_from_slice(&[0, 0, 255]); }
        let result = quantize(&pixels, 2);
        // Should get 2 colors (14 bytes)
        assert_eq!(result.len(), 14);
    }

    #[test]
    fn test_empty_input() {
        let result = quantize(&[], 5);
        assert!(result.is_empty());
    }
}

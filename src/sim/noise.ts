const TAU = Math.PI * 2;

function fade(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export class ValueNoise3D {
  private readonly seed: number;

  constructor(seed: number) {
    this.seed = seed | 0;
  }

  private hash(x: number, y: number, z: number): number {
    let h = this.seed;
    h ^= Math.imul(x, 0x27d4eb2d);
    h = (h << 13) | (h >>> 19);
    h ^= Math.imul(y, 0x165667b1);
    h = (h << 11) | (h >>> 21);
    h ^= Math.imul(z, 0x1b873593);
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    h ^= h >>> 16;
    return h;
  }

  private valueAt(x: number, y: number, z: number): number {
    const n = this.hash(x, y, z) >>> 0;
    return (n / 0xffffffff) * 2 - 1;
  }

  noise(x: number, y: number, z: number): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const z0 = Math.floor(z);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const z1 = z0 + 1;

    const tx = fade(x - x0);
    const ty = fade(y - y0);
    const tz = fade(z - z0);

    const c000 = this.valueAt(x0, y0, z0);
    const c100 = this.valueAt(x1, y0, z0);
    const c010 = this.valueAt(x0, y1, z0);
    const c110 = this.valueAt(x1, y1, z0);
    const c001 = this.valueAt(x0, y0, z1);
    const c101 = this.valueAt(x1, y0, z1);
    const c011 = this.valueAt(x0, y1, z1);
    const c111 = this.valueAt(x1, y1, z1);

    const x00 = lerp(c000, c100, tx);
    const x10 = lerp(c010, c110, tx);
    const x01 = lerp(c001, c101, tx);
    const x11 = lerp(c011, c111, tx);

    const y0v = lerp(x00, x10, ty);
    const y1v = lerp(x01, x11, ty);

    return lerp(y0v, y1v, tz);
  }

  flowAngle(x: number, y: number, t: number, scale: number, octaves: number, strength: number): number {
    let value = 0;
    let freq = 1;
    let amp = 1;
    let norm = 0;

    for (let i = 0; i < octaves; i += 1) {
      value += this.noise(x * scale * freq, y * scale * freq, t * 0.35 * freq) * amp;
      norm += amp;
      freq *= 2;
      amp *= 0.5;
    }

    const fbm = norm > 0 ? value / norm : 0;
    return fbm * TAU * strength;
  }
}

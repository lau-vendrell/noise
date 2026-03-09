export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function ease(current: number, target: number, attack: number, release: number): number {
  const factor = target > current ? attack : release;
  return current + (target - current) * factor;
}

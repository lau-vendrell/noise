export function formatControlValue(value: number, formatter?: (value: number) => string): string {
  if (formatter) return formatter(value);
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(Math.round(rounded)) : String(rounded);
}

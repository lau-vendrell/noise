import { formatControlValue } from './format';

interface CreateSliderRowArgs {
  label: string;
  min: number;
  max: number;
  step: number;
  initialValue: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}

export interface SliderRowRefs {
  input: HTMLInputElement;
  value: HTMLSpanElement;
  format?: (value: number) => string;
}

export function createSliderRow(args: CreateSliderRowArgs): { row: HTMLLabelElement; refs: SliderRowRefs } {
  const row = document.createElement('label');
  row.className = 'control-row';

  const label = document.createElement('span');
  label.className = 'control-label';
  label.textContent = args.label;

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(args.min);
  input.max = String(args.max);
  input.step = String(args.step);
  input.value = String(args.initialValue);

  const value = document.createElement('span');
  value.className = 'control-value';
  value.textContent = formatControlValue(Number(input.value), args.format);

  input.addEventListener('input', () => {
    const numeric = Number(input.value);
    value.textContent = formatControlValue(numeric, args.format);
    args.onChange(numeric);
  });

  row.appendChild(label);
  row.appendChild(input);
  row.appendChild(value);

  return { row, refs: { input, value, format: args.format } };
}

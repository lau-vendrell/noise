import { MicrophoneStatus } from '../../audio/microphone';
import { AppSettings, ControlMode, SimulationSettings, VoiceControlSettings } from '../../sim/simulationState';

export interface SliderConfig<T extends string> {
  id: T;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
}

export interface SliderRefs {
  input: HTMLInputElement;
  value: HTMLSpanElement;
  format?: (value: number) => string;
}

export interface ControlPanelActions {
  onModeChange: (mode: ControlMode) => void;
  onManualChange: (next: Partial<SimulationSettings>) => void;
  onVoiceChange: (next: Partial<VoiceControlSettings>) => void;
  onSeed: () => void;
  onReset: () => void;
  onTogglePause: () => void;
  onToggleMicrophone: () => void;
}

export interface ControlPanelApi {
  sync: (settings: AppSettings) => void;
  updateMicrophone: (status: MicrophoneStatus, level: number) => void;
  setVisible: (nextVisible: boolean) => void;
}

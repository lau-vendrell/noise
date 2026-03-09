import { MicrophoneStatus } from '../../audio/microphone';

export const CHEVRON_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';

export function isMicOn(status: MicrophoneStatus): boolean {
  return status === 'listening';
}

export function getMicIcon(status: MicrophoneStatus): string {
  if (isMicOn(status)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
  }

  return '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2"></path><path d="M19 10v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
}

export function getMicButtonLabel(status: MicrophoneStatus): string {
  return isMicOn(status) ? 'Listening' : 'Start speaking';
}

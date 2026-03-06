export type MicrophoneStatus = 'off' | 'listening' | 'denied' | 'error';

type StatusListener = (status: MicrophoneStatus) => void;

export class MicrophoneController {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private status: MicrophoneStatus = 'off';
  private listeners = new Set<StatusListener>();

  getStatus(): MicrophoneStatus {
    return this.status;
  }

  getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  async startMicrophone(): Promise<void> {
    if (this.status === 'listening' && this.analyser) return;

    try {
      this.stopMicrophone();
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0;
      this.source.connect(this.analyser);
      this.setStatus('listening');
    } catch (error) {
      const denied = error instanceof DOMException &&
        (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError');
      this.stopMicrophone();
      this.setStatus(denied ? 'denied' : 'error');
    }
  }

  stopMicrophone(): void {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
    this.setStatus('off');
  }

  private setStatus(status: MicrophoneStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.listeners.forEach((listener) => listener(status));
  }
}

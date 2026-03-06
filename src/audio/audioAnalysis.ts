export interface AudioFeatures {
  rms: number;
  energy: number;
  flux: number;
  centroid: number;
}

const EMPTY_FEATURES: AudioFeatures = {
  rms: 0,
  energy: 0,
  flux: 0,
  centroid: 0
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export class AudioFeatureExtractor {
  private timeData: Uint8Array<ArrayBuffer> = new Uint8Array(0);
  private freqData: Uint8Array<ArrayBuffer> = new Uint8Array(0);
  private prevFreq: Float32Array<ArrayBuffer> = new Float32Array(0);

  analyze(analyser: AnalyserNode | null): AudioFeatures {
    if (!analyser) {
      this.timeData = new Uint8Array(0);
      this.freqData = new Uint8Array(0);
      this.prevFreq = new Float32Array(0);
      return EMPTY_FEATURES;
    }

    if (this.timeData.length !== analyser.fftSize) {
      this.timeData = new Uint8Array(analyser.fftSize);
    }

    if (this.freqData.length !== analyser.frequencyBinCount) {
      this.freqData = new Uint8Array(analyser.frequencyBinCount);
      this.prevFreq = new Float32Array(analyser.frequencyBinCount);
    }

    analyser.getByteTimeDomainData(this.timeData);
    analyser.getByteFrequencyData(this.freqData);

    let rmsAccum = 0;
    for (let i = 0; i < this.timeData.length; i += 1) {
      const sample = (this.timeData[i] - 128) / 128;
      rmsAccum += sample * sample;
    }
    const rms = Math.sqrt(rmsAccum / this.timeData.length);

    let energyAccum = 0;
    let weightedFreq = 0;
    let weightSum = 0;
    let fluxAccum = 0;

    for (let i = 0; i < this.freqData.length; i += 1) {
      const value = this.freqData[i] / 255;
      energyAccum += value;
      weightedFreq += i * value;
      weightSum += value;

      const previous = this.prevFreq[i];
      const diff = value - previous;
      if (diff > 0) {
        fluxAccum += diff;
      }
      this.prevFreq[i] = value;
    }

    const energy = energyAccum / this.freqData.length;
    const flux = fluxAccum / this.freqData.length;
    const centroid = weightSum > 0 ? (weightedFreq / weightSum) / this.freqData.length : 0;

    return {
      rms: clamp01(rms),
      energy: clamp01(energy),
      flux: clamp01(flux * 2.4),
      centroid: clamp01(centroid)
    };
  }
}

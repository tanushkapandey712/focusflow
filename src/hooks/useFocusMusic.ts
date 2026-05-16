import { useCallback, useEffect, useRef, useState } from "react";

export type FocusSoundType = "brown" | "rain" | "cafe" | "white";

export interface FocusSoundOption {
  id: FocusSoundType;
  label: string;
  emoji: string;
  description: string;
}

export const FOCUS_SOUNDS: FocusSoundOption[] = [
  { id: "brown", label: "Deep Focus", emoji: "🌊", description: "Rich brown noise" },
  { id: "rain", label: "Rain", emoji: "🌧️", description: "Gentle rainfall" },
  { id: "cafe", label: "Café", emoji: "☕", description: "Ambient café" },
  { id: "white", label: "White Noise", emoji: "🔇", description: "Pure white noise" },
];

/**
 * Generates ambient focus sounds using the Web Audio API.
 * All sounds are procedurally generated — no external assets required.
 */
export const useFocusMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [soundType, setSoundType] = useState<FocusSoundType>("brown");

  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  // Holds all currently active source/filter nodes so they can be cleaned up
  const nodesRef = useRef<AudioNode[]>([]);

  /** Tear down all audio nodes without closing the context. */
  const stopNodes = useCallback(() => {
    nodesRef.current.forEach((node) => {
      try {
        (node as AudioScheduledSourceNode).stop?.();
        node.disconnect();
      } catch {
        /* already stopped */
      }
    });
    nodesRef.current = [];
  }, []);

  /** Create (or reuse) the AudioContext and master gain. Returns a promise that resolves once the context is running. */
  const ensureContext = useCallback(async () => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      await ctxRef.current.resume();
    }
    if (!gainRef.current || gainRef.current.context !== ctxRef.current) {
      gainRef.current = ctxRef.current.createGain();
      gainRef.current.gain.value = volume;
      gainRef.current.connect(ctxRef.current.destination);
    }
    return { ctx: ctxRef.current, gain: gainRef.current };
  }, [volume]);

  /** Build a noise buffer (white noise base, reused by all sound types). */
  const createNoiseBuffer = useCallback((ctx: AudioContext, seconds = 4) => {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }, []);

  /** Brown noise = integrated white noise (low-pass character). */
  const startBrownNoise = useCallback(
    (ctx: AudioContext, gain: GainNode) => {
      const bufferSize = ctx.sampleRate * 8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // normalise
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Gentle low-pass for warmth
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 800;
      lp.Q.value = 0.5;

      source.connect(lp);
      lp.connect(gain);
      source.start();
      nodesRef.current.push(source, lp);
    },
    [],
  );

  /** White noise — flat spectrum. */
  const startWhiteNoise = useCallback(
    (ctx: AudioContext, gain: GainNode) => {
      const source = ctx.createBufferSource();
      source.buffer = createNoiseBuffer(ctx, 6);
      source.loop = true;
      source.connect(gain);
      source.start();
      nodesRef.current.push(source);
    },
    [createNoiseBuffer],
  );

  /** Rain = brown noise + high-frequency drip modulated via LFO. */
  const startRain = useCallback(
    (ctx: AudioContext, gain: GainNode) => {
      // Base layer: brown-ish noise
      const bufferSize = ctx.sampleRate * 8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      const rainSource = ctx.createBufferSource();
      rainSource.buffer = buffer;
      rainSource.loop = true;

      // Band-pass to isolate "rain" frequencies
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1200;
      bp.Q.value = 0.8;

      // Subtle high shelf for sparkle
      const hs = ctx.createBiquadFilter();
      hs.type = "highshelf";
      hs.frequency.value = 6000;
      hs.gain.value = 4;

      // LFO to modulate gain (gives rhythmic patter feel)
      const lfoGain = ctx.createGain();
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.25; // slow swell
      const lfoAmp = ctx.createGain();
      lfoAmp.gain.value = 0.15;
      lfo.connect(lfoAmp);
      lfoAmp.connect(lfoGain.gain);
      lfo.start();

      rainSource.connect(bp);
      bp.connect(hs);
      hs.connect(lfoGain);
      lfoGain.connect(gain);

      rainSource.start();
      nodesRef.current.push(rainSource, bp, hs, lfoGain, lfo, lfoAmp);
    },
    [],
  );

  /** Café = brown noise + subtle random "chatter" bursts via noise grains. */
  const startCafe = useCallback(
    (ctx: AudioContext, gain: GainNode) => {
      // Background hum
      const bufferSize = ctx.sampleRate * 8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 2;
      }

      const bgSource = ctx.createBufferSource();
      bgSource.buffer = buffer;
      bgSource.loop = true;

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 600;
      lp.Q.value = 0.7;

      bgSource.connect(lp);
      lp.connect(gain);
      bgSource.start();

      // Sparse "clink / cutlery" layer — short filtered noise bursts via periodic scheduling
      const clinkGain = ctx.createGain();
      clinkGain.gain.value = 0.08;
      clinkGain.connect(gain);

      let nextClink = ctx.currentTime + 1.5;
      let stopped = false;

      const scheduleClinks = () => {
        if (stopped || !ctxRef.current) return;
        const now = ctxRef.current.currentTime;
        while (nextClink < now + 2) {
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.6, nextClink);
          g.gain.exponentialRampToValueAtTime(0.001, nextClink + 0.18);
          const s = ctx.createBufferSource();
          s.buffer = createNoiseBuffer(ctx, 0.25);

          const hpf = ctx.createBiquadFilter();
          hpf.type = "highpass";
          hpf.frequency.value = 3000 + Math.random() * 4000;

          s.connect(hpf);
          hpf.connect(g);
          g.connect(clinkGain);
          s.start(nextClink);
          s.stop(nextClink + 0.25);

          nextClink += 2 + Math.random() * 6;
        }

        const tid = setTimeout(scheduleClinks, 1500);
        // Store cleanup via a fake audio node approach
        (clinkGain as unknown as { _tid: ReturnType<typeof setTimeout> })._tid = tid;
      };

      scheduleClinks();

      // Track for cleanup
      const stopClinkScheduler = ctx.createGain(); // dummy node used as cleanup sentinel
      (stopClinkScheduler as unknown as { _onStop: () => void })._onStop = () => {
        stopped = true;
      };

      nodesRef.current.push(bgSource, lp, clinkGain, stopClinkScheduler);
    },
    [createNoiseBuffer],
  );

  /** Stop all sounds. */
  const stop = useCallback(() => {
    stopNodes();
    // Run any registered _onStop callbacks
    nodesRef.current.forEach((node) => {
      const n = node as unknown as { _onStop?: () => void };
      n._onStop?.();
    });
    nodesRef.current = [];
    setIsPlaying(false);
  }, [stopNodes]);

  /** Start the currently selected sound. */
  const play = useCallback(async () => {
    stopNodes();
    const { ctx, gain } = await ensureContext();

    // Guard: context must be running before we schedule nodes
    if (ctx.state !== "running") return;

    switch (soundType) {
      case "brown": startBrownNoise(ctx, gain); break;
      case "white": startWhiteNoise(ctx, gain); break;
      case "rain":  startRain(ctx, gain);       break;
      case "cafe":  startCafe(ctx, gain);        break;
    }

    setIsPlaying(true);
  }, [ensureContext, soundType, startBrownNoise, startCafe, startRain, startWhiteNoise, stopNodes]);

  const toggle = useCallback(() => {
    if (isPlaying) stop();
    else void play();
  }, [isPlaying, play, stop]);

  /** Change sound type — restart if already playing. */
  const changeSound = useCallback(
    (type: FocusSoundType) => {
      setSoundType(type);
      if (isPlaying) {
        // Will trigger a re-play via the effect below
        stopNodes();
      }
    },
    [isPlaying, stopNodes],
  );

  /** Restart when sound type changes mid-playback. */
  useEffect(() => {
    if (!isPlaying) return;
    void (async () => {
      const { ctx, gain } = await ensureContext();
      if (ctx.state !== "running") return;
      switch (soundType) {
        case "brown": startBrownNoise(ctx, gain); break;
        case "white": startWhiteNoise(ctx, gain); break;
        case "rain":  startRain(ctx, gain);       break;
        case "cafe":  startCafe(ctx, gain);        break;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundType]);

  /** Live-update gain when volume slider changes. */
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.setTargetAtTime(volume, gainRef.current.context.currentTime, 0.05);
    }
  }, [volume]);

  /** Cleanup on unmount. */
  useEffect(() => {
    return () => {
      stopNodes();
      try { ctxRef.current?.close(); } catch { /* ignore */ }
    };
  }, [stopNodes]);

  return {
    isPlaying,
    volume,
    setVolume,
    soundType,
    changeSound,
    toggle,
    play,
    stop,
  };
};

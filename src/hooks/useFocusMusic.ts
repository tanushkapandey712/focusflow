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
  { id: "rain",  label: "Rain",       emoji: "🌧️", description: "Gentle rainfall" },
  { id: "cafe",  label: "Café",       emoji: "☕", description: "Ambient café" },
  { id: "white", label: "White Noise",emoji: "🔇", description: "Pure white noise" },
];

/**
 * Generates ambient focus sounds using the Web Audio API.
 * All sounds are procedurally generated — no external assets required.
 *
 * Strategy:
 *  1. AudioContext is created synchronously inside the click handler
 *     (preserves the user-gesture stack so browsers allow audio).
 *  2. Audio nodes are started BEFORE calling resume() — nodes scheduled
 *     on a suspended context are queued and fire the moment it resumes.
 *  3. resume() is called with .catch() — never let a rejection surface.
 */
export const useFocusMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume]       = useState(0.3);
  const [soundType, setSoundType] = useState<FocusSoundType>("brown");

  const ctxRef   = useRef<AudioContext | null>(null);
  const gainRef  = useRef<GainNode | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /** Stop and disconnect all active source/filter nodes. */
  const stopNodes = useCallback(() => {
    nodesRef.current.forEach((node) => {
      try {
        (node as AudioScheduledSourceNode).stop?.();
        node.disconnect();
      } catch { /* already stopped */ }
    });
    nodesRef.current = [];
  }, []);

  /**
   * Ensure AudioContext + GainNode exist.
   * Deliberately SYNCHRONOUS so it stays within the user-gesture call stack.
   * resume() is called separately, after nodes are already queued.
   */
  const ensureContext = useCallback((vol: number) => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    if (!gainRef.current || gainRef.current.context !== ctxRef.current) {
      gainRef.current = ctxRef.current.createGain();
      gainRef.current.gain.value = vol;
      gainRef.current.connect(ctxRef.current.destination);
    }
    return { ctx: ctxRef.current, gain: gainRef.current };
  }, []);

  // ─── Noise generators ────────────────────────────────────────────────────

  const createNoiseBuffer = useCallback((ctx: AudioContext, seconds = 4) => {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }, []);

  const startBrownNoise = useCallback((ctx: AudioContext, gain: GainNode) => {
    const bufferSize = ctx.sampleRate * 8;
    const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i]     = (lastOut + 0.02 * white) / 1.02;
      lastOut     = data[i];
      data[i]    *= 3.5;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop   = true;

    const lp       = ctx.createBiquadFilter();
    lp.type        = "lowpass";
    lp.frequency.value = 800;
    lp.Q.value     = 0.5;

    source.connect(lp);
    lp.connect(gain);
    source.start();
    nodesRef.current.push(source, lp);
  }, []);

  const startWhiteNoise = useCallback((ctx: AudioContext, gain: GainNode) => {
    const source    = ctx.createBufferSource();
    source.buffer   = createNoiseBuffer(ctx, 6);
    source.loop     = true;
    source.connect(gain);
    source.start();
    nodesRef.current.push(source);
  }, [createNoiseBuffer]);

  const startRain = useCallback((ctx: AudioContext, gain: GainNode) => {
    const bufferSize = ctx.sampleRate * 8;
    const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i]     = (lastOut + 0.02 * white) / 1.02;
      lastOut     = data[i];
      data[i]    *= 3.5;
    }

    const rainSource    = ctx.createBufferSource();
    rainSource.buffer   = buffer;
    rainSource.loop     = true;

    const bp            = ctx.createBiquadFilter();
    bp.type             = "bandpass";
    bp.frequency.value  = 1200;
    bp.Q.value          = 0.8;

    const hs            = ctx.createBiquadFilter();
    hs.type             = "highshelf";
    hs.frequency.value  = 6000;
    hs.gain.value       = 4;

    const lfoGain       = ctx.createGain();
    const lfo           = ctx.createOscillator();
    lfo.type            = "sine";
    lfo.frequency.value = 0.25;
    const lfoAmp        = ctx.createGain();
    lfoAmp.gain.value   = 0.15;
    lfo.connect(lfoAmp);
    lfoAmp.connect(lfoGain.gain);
    lfo.start();

    rainSource.connect(bp);
    bp.connect(hs);
    hs.connect(lfoGain);
    lfoGain.connect(gain);
    rainSource.start();
    nodesRef.current.push(rainSource, bp, hs, lfoGain, lfo, lfoAmp);
  }, []);

  const startCafe = useCallback((ctx: AudioContext, gain: GainNode) => {
    const bufferSize = ctx.sampleRate * 8;
    const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i]     = (lastOut + 0.02 * white) / 1.02;
      lastOut     = data[i];
      data[i]    *= 2;
    }

    const bgSource    = ctx.createBufferSource();
    bgSource.buffer   = buffer;
    bgSource.loop     = true;

    const lp          = ctx.createBiquadFilter();
    lp.type           = "lowpass";
    lp.frequency.value = 600;
    lp.Q.value        = 0.7;

    bgSource.connect(lp);
    lp.connect(gain);
    bgSource.start();

    const clinkGain         = ctx.createGain();
    clinkGain.gain.value    = 0.08;
    clinkGain.connect(gain);

    let nextClink = ctx.currentTime + 1.5;
    let stopped   = false;

    const scheduleClinks = () => {
      if (stopped || !ctxRef.current) return;
      const now = ctxRef.current.currentTime;
      while (nextClink < now + 2) {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.6, nextClink);
        g.gain.exponentialRampToValueAtTime(0.001, nextClink + 0.18);
        const s   = ctx.createBufferSource();
        s.buffer  = createNoiseBuffer(ctx, 0.25);
        const hpf = ctx.createBiquadFilter();
        hpf.type  = "highpass";
        hpf.frequency.value = 3000 + Math.random() * 4000;
        s.connect(hpf);
        hpf.connect(g);
        g.connect(clinkGain);
        s.start(nextClink);
        s.stop(nextClink + 0.25);
        nextClink += 2 + Math.random() * 6;
      }
      const tid = setTimeout(scheduleClinks, 1500);
      (clinkGain as unknown as { _tid: ReturnType<typeof setTimeout> })._tid = tid;
    };
    scheduleClinks();

    const sentinel = ctx.createGain();
    (sentinel as unknown as { _onStop: () => void })._onStop = () => { stopped = true; };
    nodesRef.current.push(bgSource, lp, clinkGain, sentinel);
  }, [createNoiseBuffer]);

  // ─── Start / stop helpers ────────────────────────────────────────────────

  const startSound = useCallback((type: FocusSoundType, ctx: AudioContext, gain: GainNode) => {
    switch (type) {
      case "brown": startBrownNoise(ctx, gain); break;
      case "white": startWhiteNoise(ctx, gain); break;
      case "rain":  startRain(ctx, gain);        break;
      case "cafe":  startCafe(ctx, gain);         break;
    }
  }, [startBrownNoise, startWhiteNoise, startRain, startCafe]);

  // ─── Public API ──────────────────────────────────────────────────────────

  /** Stop all sounds. */
  const stop = useCallback(() => {
    stopNodes();
    nodesRef.current.forEach((node) => {
      (node as unknown as { _onStop?: () => void })._onStop?.();
    });
    nodesRef.current = [];
    setIsPlaying(false);
  }, [stopNodes]);

  /**
   * Play — kept intentionally SYNCHRONOUS so it runs within the user-gesture
   * call stack.  Nodes are started first (they queue on a suspended context),
   * then resume() is fired.  This is the canonical pattern for Web Audio.
   */
  const play = useCallback((type: FocusSoundType = soundType) => {
    stopNodes();
    const { ctx, gain } = ensureContext(volume);

    // Schedule nodes first — they will fire as soon as ctx resumes
    startSound(type, ctx, gain);

    // Kick off resume (non-blocking; nodes are already queued)
    if (ctx.state !== "running") {
      ctx.resume().catch((err) => console.warn("[FocusMusic] resume failed:", err));
    }

    setIsPlaying(true);
  }, [ensureContext, soundType, startSound, stopNodes, volume]);

  const toggle = useCallback(() => {
    if (isPlaying) stop();
    else play();
  }, [isPlaying, play, stop]);

  /** Change sound type — restart immediately if already playing. */
  const changeSound = useCallback((type: FocusSoundType) => {
    setSoundType(type);
    if (isPlaying) {
      stopNodes();
      const { ctx, gain } = ensureContext(volume);
      startSound(type, ctx, gain);
      if (ctx.state !== "running") {
        ctx.resume().catch((err) => console.warn("[FocusMusic] resume failed:", err));
      }
    }
  }, [ensureContext, isPlaying, startSound, stopNodes, volume]);

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

  return { isPlaying, volume, setVolume, soundType, changeSound, toggle, play, stop };
};

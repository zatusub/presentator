/**
 * Play a short beep using Web Audio API (880 Hz square wave, 150ms).
 * No external audio files needed.
 */
export const beep = (): void => {
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = "square";
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch {
        // Silently fail if AudioContext is not available
    }
};

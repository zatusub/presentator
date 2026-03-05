/**
 * Format milliseconds to "m:ss" or "-m:ss" for display.
 */
export const formatTime = (ms: number): string => {
    const negative = ms < 0;
    const abs = Math.abs(ms);
    const m = Math.floor(abs / 60000);
    const s = Math.floor((abs % 60000) / 1000);
    return `${negative ? "-" : ""}${m}:${s.toString().padStart(2, "0")}`;
};

/**
 * Convert "mmss" 4-digit string to milliseconds.
 * e.g. "0130" → 90000 (1m30s)
 */
export const durationToMs = (duration: string): number => {
    if (!duration || duration.length === 0) return 0;
    const padded = duration.padStart(4, "0");
    const mm = parseInt(padded.slice(0, 2), 10);
    const ss = parseInt(padded.slice(2, 4), 10);
    return (mm * 60 + ss) * 1000;
};

/**
 * Convert milliseconds to "mmss" 4-digit string.
 * e.g. 90000 → "0130"
 */
export const msToMmss = (ms: number): string => {
    const totalSec = Math.floor(Math.abs(ms) / 1000);
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    return `${mm.toString().padStart(2, "0")}${ss.toString().padStart(2, "0")}`;
};

/**
 * Format raw digit input to "mm:ss" display.
 * e.g. "" → "", "0" → "00:00", "01" → "00:01", "013" → "00:13", "0130" → "01:30"
 */
export const formatDurationInput = (raw: string): string => {
    if (raw.length === 0) return "";
    const padded = raw.padStart(4, "0");
    return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
};

/**
 * Format "mmss" to "mm:ss" for static display.
 */
export const formatMmss = (duration: string): string => {
    if (!duration || duration.length === 0) return "00:00";
    const padded = duration.padStart(4, "0");
    return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
};

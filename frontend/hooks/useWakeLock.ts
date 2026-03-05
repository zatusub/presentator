"use client";

import { useEffect, useRef } from "react";

/**
 * Request a screen Wake Lock when the component mounts.
 * Silently fails on unsupported browsers.
 */
export function useWakeLock() {
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    useEffect(() => {
        let active = true;

        const request = async () => {
            try {
                if ("wakeLock" in navigator) {
                    const lock = await navigator.wakeLock.request("screen");
                    if (active) {
                        wakeLockRef.current = lock;
                    } else {
                        lock.release();
                    }
                }
            } catch {
                // Wake Lock request failed (e.g. low battery, not visible)
            }
        };

        request();

        // Re-acquire on visibility change
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                request();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            active = false;
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (wakeLockRef.current) {
                wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
        };
    }, []);
}

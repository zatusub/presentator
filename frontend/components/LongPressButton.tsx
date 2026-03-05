"use client";

import { useCallback, useRef, useState } from "react";

type LongPressButtonProps = {
    onActivate: () => void;
    duration?: number; // ms, default 1000
    children: React.ReactNode;
    className?: string;
};

export function LongPressButton({
    onActivate,
    duration = 1000,
    children,
    className = "",
}: LongPressButtonProps) {
    const [progress, setProgress] = useState(0);
    const [pressing, setPressing] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

    const startPress = useCallback(() => {
        setPressing(true);
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const pct = Math.min(elapsed / duration, 1);
            setProgress(pct);
            if (pct >= 1) {
                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = null;
                setPressing(false);
                setProgress(0);
                onActivate();
            }
        }, 16);
    }, [duration, onActivate]);

    const cancelPress = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setPressing(false);
        setProgress(0);
    }, []);

    // Progress ring SVG
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress);

    return (
        <button
            className={`relative flex items-center justify-center ${className}`}
            onMouseDown={startPress}
            onMouseUp={cancelPress}
            onMouseLeave={cancelPress}
            onTouchStart={startPress}
            onTouchEnd={cancelPress}
            onTouchCancel={cancelPress}
        >
            {pressing && (
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 44 44"
                >
                    <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        fill="none"
                        stroke="rgba(59, 130, 246, 0.5)"
                        strokeWidth="3"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        transform="rotate(-90 22 22)"
                        className="transition-none"
                    />
                </svg>
            )}
            {children}
        </button>
    );
}

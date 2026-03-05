"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Section } from "@/lib/types";
import { durationToMs } from "@/lib/formatTime";

export type TimerStatus = "countdown" | "running" | "paused" | "finished";

export type TimerSection = {
    name: string;
    duration: number; // ms
    memo: string;
    cumulativeEnd: number; // ms
};

export type TimerState = {
    status: TimerStatus;
    countdownValue: number;
    globalElapsed: number;
    globalTotal: number;
    currentSectionIndex: number;
    sections: TimerSection[];
};

function buildTimerSections(sections: Section[]): TimerSection[] {
    let cumulative = 0;
    return sections.map((s) => {
        const dur = durationToMs(s.duration);
        cumulative += dur;
        return {
            name: s.name,
            duration: dur,
            memo: s.memo,
            cumulativeEnd: cumulative,
        };
    });
}

export function useTimer(sections: Section[]) {
    const timerSections = useRef<TimerSection[]>(buildTimerSections(sections));
    const globalTotal = timerSections.current.reduce((sum, s) => sum + s.duration, 0);

    const [state, setState] = useState<TimerState>({
        status: "countdown",
        countdownValue: 3,
        globalElapsed: 0,
        globalTotal,
        currentSectionIndex: 0,
        sections: timerSections.current,
    });

    const startTimeRef = useRef<number>(0);
    const elapsedBeforePauseRef = useRef<number>(0);
    const rafRef = useRef<number>(0);

    // Countdown logic
    useEffect(() => {
        if (state.status !== "countdown") return;
        if (state.countdownValue <= 0) {
            setState((s) => ({ ...s, status: "running" }));
            startTimeRef.current = performance.now();
            return;
        }
        const timer = setTimeout(() => {
            setState((s) => ({ ...s, countdownValue: s.countdownValue - 1 }));
        }, 1000);
        return () => clearTimeout(timer);
    }, [state.status, state.countdownValue]);

    // Running logic with rAF
    useEffect(() => {
        if (state.status !== "running") return;

        const tick = () => {
            const now = performance.now();
            const elapsed = elapsedBeforePauseRef.current + (now - startTimeRef.current);
            setState((s) => {
                const newState = { ...s, globalElapsed: elapsed };
                // Check if total time exceeded
                if (elapsed >= s.globalTotal) {
                    newState.status = "finished";
                }
                return newState;
            });
            rafRef.current = requestAnimationFrame(tick);
        };

        startTimeRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [state.status]);

    const pause = useCallback(() => {
        if (state.status !== "running") return;
        cancelAnimationFrame(rafRef.current);
        elapsedBeforePauseRef.current = state.globalElapsed;
        setState((s) => ({ ...s, status: "paused" }));
    }, [state.status, state.globalElapsed]);

    const resume = useCallback(() => {
        if (state.status !== "paused") return;
        startTimeRef.current = performance.now();
        setState((s) => ({ ...s, status: "running" }));
    }, [state.status]);

    const togglePause = useCallback(() => {
        if (state.status === "running") pause();
        else if (state.status === "paused") resume();
    }, [state.status, pause, resume]);

    const goToSection = useCallback(
        (index: number) => {
            if (index < 0 || index >= timerSections.current.length) return;
            setState((s) => ({ ...s, currentSectionIndex: index }));
        },
        []
    );

    const nextSection = useCallback(() => {
        setState((s) => {
            if (s.currentSectionIndex < s.sections.length - 1) {
                return { ...s, currentSectionIndex: s.currentSectionIndex + 1 };
            }
            return s;
        });
    }, []);

    const prevSection = useCallback(() => {
        setState((s) => {
            if (s.currentSectionIndex > 0) {
                return { ...s, currentSectionIndex: s.currentSectionIndex - 1 };
            }
            return s;
        });
    }, []);

    const reset = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        elapsedBeforePauseRef.current = 0;
        startTimeRef.current = 0;
        setState({
            status: "countdown",
            countdownValue: 3,
            globalElapsed: 0,
            globalTotal: globalTotal,
            currentSectionIndex: 0,
            sections: timerSections.current,
        });
    }, [globalTotal]);

    // Derived values
    const currentSection = state.sections[state.currentSectionIndex];
    const sectionRemaining = currentSection
        ? currentSection.cumulativeEnd - state.globalElapsed
        : 0;
    const globalRemaining = state.globalTotal - state.globalElapsed;

    return {
        state,
        currentSection,
        sectionRemaining,
        globalRemaining,
        togglePause,
        nextSection,
        prevSection,
        goToSection,
        reset,
        pause,
        resume,
    };
}

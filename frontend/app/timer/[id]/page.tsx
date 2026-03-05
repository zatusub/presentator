"use client";

import { useEffect, useRef, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { usePresentationStore } from "@/stores/presentationStore";
import { useTimer } from "@/hooks/useTimer";
import { useSwipe } from "@/hooks/useSwipe";
import { useWakeLock } from "@/hooks/useWakeLock";
import { ProgressBar } from "@/components/ProgressBar";
import { TimerDisplay } from "@/components/TimerDisplay";
import { MemoView } from "@/components/MemoView";
import { CountdownOverlay } from "@/components/CountdownOverlay";
import { LongPressButton } from "@/components/LongPressButton";
import { formatTime, formatMmss } from "@/lib/formatTime";
import { beep } from "@/lib/beep";

export default function TimerPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const store = usePresentationStore();
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        store.hydrate();
        setHydrated(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const presentation = store.getById(id);

    if (!hydrated || !presentation) {
        return (
            <div className="min-h-dvh flex items-center justify-center text-[#888]">
                {hydrated ? "発表が見つかりません" : "読み込み中..."}
            </div>
        );
    }

    return <TimerView presentationId={id} />;
}

function TimerView({ presentationId }: { presentationId: string }) {
    const router = useRouter();
    const store = usePresentationStore();
    const presentation = store.getById(presentationId)!;

    const {
        state,
        currentSection,
        sectionRemaining,
        globalRemaining,
        togglePause,
        nextSection,
        prevSection,
        reset,
    } = useTimer(presentation.sections);

    useWakeLock();

    // Red flash state
    const [showFlash, setShowFlash] = useState(false);
    const flashedSections = useRef<Set<number>>(new Set());

    // Track vibration for 10s warning
    const vibrated10s = useRef<Set<number>>(new Set());

    // TIME UP overlay
    const [showTimeUp, setShowTimeUp] = useState(false);

    // Section overtime beep/flash
    useEffect(() => {
        if (state.status !== "running" && state.status !== "paused") return;

        // Check if current section just went overtime
        if (
            sectionRemaining < 0 &&
            !flashedSections.current.has(state.currentSectionIndex)
        ) {
            flashedSections.current.add(state.currentSectionIndex);
            beep();
            setShowFlash(true);
            setTimeout(() => setShowFlash(false), 300);
            try {
                navigator.vibrate?.(200);
            } catch {/* */ }
        }

        // 10s warning vibration
        if (
            sectionRemaining <= 10000 &&
            sectionRemaining > 0 &&
            !vibrated10s.current.has(state.currentSectionIndex)
        ) {
            vibrated10s.current.add(state.currentSectionIndex);
            try {
                navigator.vibrate?.(200);
            } catch {/* */ }
        }
    }, [sectionRemaining, state.currentSectionIndex, state.status]);

    // TIME UP
    useEffect(() => {
        if (state.status === "finished") {
            setShowTimeUp(true);
            beep();
        }
    }, [state.status]);

    // Haptic on section change
    const prevSectionIndex = useRef(0);
    useEffect(() => {
        if (state.currentSectionIndex !== prevSectionIndex.current) {
            prevSectionIndex.current = state.currentSectionIndex;
            try {
                navigator.vibrate?.(50);
            } catch {/* */ }
        }
    }, [state.currentSectionIndex]);

    // Swipe handlers for non-memo areas
    const swipeHandlers = useSwipe({
        onSwipeLeft: nextSection,
        onSwipeRight: prevSection,
    });

    const handleBack = useCallback(() => {
        router.push(`/edit/${presentationId}`);
    }, [router, presentationId]);

    const handleReset = useCallback(() => {
        reset();
        setShowTimeUp(false);
        flashedSections.current.clear();
        vibrated10s.current.clear();
    }, [reset]);

    // Next section info
    const nextSectionData =
        state.currentSectionIndex < state.sections.length - 1
            ? state.sections[state.currentSectionIndex + 1]
            : null;

    const isCountdown = state.status === "countdown";

    return (
        <div className="h-dvh flex flex-col relative overflow-hidden select-none">
            {/* Red flash overlay */}
            {showFlash && (
                <div className="absolute inset-0 bg-red-900/50 z-30 pointer-events-none animate-[redFlash_0.3s_ease-out]" />
            )}

            {/* TIME UP overlay */}
            {showTimeUp && (
                <div
                    className="absolute inset-0 z-30 flex items-center justify-center bg-[#0a0a0a]/80"
                    onClick={() => setShowTimeUp(false)}
                >
                    <div className="text-6xl font-bold text-red-500 animate-pulse">
                        TIME UP
                    </div>
                </div>
            )}

            {/* Countdown overlay */}
            <CountdownOverlay
                value={state.countdownValue}
                visible={isCountdown}
            />

            {/* Main content (swipeable except memo) */}
            <div
                className="flex flex-col flex-1 min-h-0"
                {...swipeHandlers}
            >
                {/* Progress bar */}
                <div className="px-4 pt-2">
                    <ProgressBar
                        sections={state.sections}
                        currentSectionIndex={state.currentSectionIndex}
                        globalElapsed={state.globalElapsed}
                        globalTotal={state.globalTotal}
                    />
                </div>

                {/* Section info */}
                <div>
                    <TimerDisplay
                        sectionName={currentSection?.name || ""}
                        sectionRemaining={sectionRemaining}
                        globalRemaining={globalRemaining}
                    />
                </div>

                {/* Memo area (no swipe, scrollable) */}
                <div
                    className="flex-1 min-h-0 overflow-hidden"
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                >
                    <MemoView memo={currentSection?.memo || ""} />
                </div>

                {/* Next section */}
                <div className="px-4 py-1 text-center">
                    {nextSectionData ? (
                        <span className="text-xs text-[#666]">
                            次: {nextSectionData.name}{" "}
                            ({formatTime(nextSectionData.duration)})
                        </span>
                    ) : (
                        <span className="text-xs text-[#666]">最後のセクションです</span>
                    )}
                </div>
            </div>

            {/* PC section nav buttons */}
            <button
                onClick={prevSection}
                className="fixed left-2 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-10 h-16 text-2xl text-white opacity-30 hover:opacity-80 transition-opacity z-20"
                aria-label="前のセクション"
            >
                ‹
            </button>
            <button
                onClick={nextSection}
                className="fixed right-2 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-10 h-16 text-2xl text-white opacity-30 hover:opacity-80 transition-opacity z-20"
                aria-label="次のセクション"
            >
                ›
            </button>

            {/* Controls */}
            <div
                className={`h-16 flex items-center justify-center gap-6 px-4 border-t border-[#1a1a2e] bg-[#0a0a0a] ${isCountdown ? "opacity-50 pointer-events-none" : ""
                    }`}
                {...swipeHandlers}
            >
                {/* Back (long press) */}
                <LongPressButton
                    onActivate={handleBack}
                    className="min-h-12 min-w-12 bg-gray-800 text-white rounded-xl px-3"
                >
                    <span className="text-lg">↩</span>
                </LongPressButton>

                {/* Pause/Resume */}
                <button
                    onClick={togglePause}
                    className="min-h-12 min-w-16 bg-gray-800 text-white rounded-xl px-4 text-lg"
                    disabled={state.status === "finished"}
                >
                    {state.status === "running" ? "⏸" : "▶"}
                </button>

                {/* Reset (long press) */}
                <LongPressButton
                    onActivate={handleReset}
                    className="min-h-12 min-w-12 bg-gray-800 text-white rounded-xl px-3"
                >
                    <span className="text-lg">🔄</span>
                </LongPressButton>
            </div>
        </div>
    );
}

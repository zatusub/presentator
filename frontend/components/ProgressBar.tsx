"use client";

import type { TimerSection } from "@/hooks/useTimer";

type ProgressBarProps = {
    sections: TimerSection[];
    currentSectionIndex: number;
    globalElapsed: number;
    globalTotal: number;
};

export function ProgressBar({
    sections,
    currentSectionIndex,
    globalElapsed,
    globalTotal,
}: ProgressBarProps) {
    return (
        <div className="w-full mb-1">
            <div className="flex w-full h-2 rounded-full overflow-hidden bg-[#1a1a2e]">
                {sections.map((section, i) => {
                    const widthPct = globalTotal > 0 ? (section.duration / globalTotal) * 100 : 0;

                    let colorClass = "bg-gray-700"; // upcoming
                    if (i < currentSectionIndex) {
                        colorClass = "bg-green-500";
                    } else if (i === currentSectionIndex) {
                        const sectionRemaining = section.cumulativeEnd - globalElapsed;
                        if (sectionRemaining < 0) {
                            colorClass = "bg-red-500 animate-pulse";
                        } else {
                            colorClass = "bg-blue-500";
                        }
                    }

                    // Current section: partial fill
                    let innerWidthPct = 100;
                    if (i === currentSectionIndex && section.duration > 0) {
                        const sectionStart =
                            section.cumulativeEnd - section.duration;
                        const elapsed = globalElapsed - sectionStart;
                        innerWidthPct = Math.min(
                            Math.max((elapsed / section.duration) * 100, 0),
                            100
                        );
                    } else if (i > currentSectionIndex) {
                        innerWidthPct = 0;
                    }

                    return (
                        <div
                            key={i}
                            className="h-full relative"
                            style={{ width: `${widthPct}%` }}
                        >
                            <div
                                className={`h-full ${colorClass} transition-all duration-100`}
                                style={{ width: `${innerWidthPct}%` }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

"use client";

import { formatTime } from "@/lib/formatTime";

type TimerDisplayProps = {
    sectionName: string;
    sectionRemaining: number; // ms, negative = overtime
    globalRemaining: number;  // ms
};

export function TimerDisplay({
    sectionName,
    sectionRemaining,
    globalRemaining,
}: TimerDisplayProps) {
    let colorClass = "text-white";
    if (sectionRemaining < 0) {
        colorClass = "text-red-500";
    } else if (sectionRemaining <= 10000) {
        colorClass = "text-red-500";
    } else if (sectionRemaining <= 30000) {
        colorClass = "text-yellow-400";
    }

    return (
        <div className="mb-1 px-4">
            <div className="text-lg font-bold text-white truncate text-center">
                {sectionName}
            </div>
            <div className="flex items-baseline justify-center gap-4">
                <div
                    className={`text-4xl font-bold font-mono tabular-nums ${colorClass} transition-colors duration-300`}
                >
                    {formatTime(sectionRemaining)}
                </div>
                <div className="text-2xl font-mono tabular-nums text-[#888] transition-colors duration-300">
                    {formatTime(Math.max(globalRemaining, 0))}
                </div>
            </div>
        </div>
    );
}

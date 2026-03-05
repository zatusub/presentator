"use client";

import { useState, useCallback, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDurationInput } from "@/lib/formatTime";

type SectionCardProps = {
    id: string;
    name: string;
    duration: string;
    memo: string;
    index: number;
    onUpdate: (updates: { name?: string; duration?: string; memo?: string }) => void;
    onDelete: () => void;
};

export function SectionCard({
    id,
    name,
    duration,
    memo,
    index,
    onUpdate,
    onDelete,
}: SectionCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const [durationRaw, setDurationRaw] = useState(duration);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Keep local state in sync with prop changes (e.g. from hydration or parent updates)
    useEffect(() => {
        setDurationRaw(duration);
    }, [duration]);

    const handleDurationChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 4);
            setDurationRaw(val);
            onUpdate({ duration: val });
        },
        [onUpdate]
    );

    const handleDurationBlur = useCallback(() => {
        if (durationRaw.length > 0 && durationRaw.length < 4) {
            const padded = durationRaw.padStart(4, "0");
            setDurationRaw(padded);
            onUpdate({ duration: padded });
        }
    }, [durationRaw, onUpdate]);

    const handleDelete = useCallback(() => {
        if (showDeleteConfirm) {
            onDelete();
        } else {
            setShowDeleteConfirm(true);
            setTimeout(() => setShowDeleteConfirm(false), 3000);
        }
    }, [showDeleteConfirm, onDelete]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-[#1a1a2e] rounded-xl p-4 border border-[#2a2a3e]"
        >
            {/* Header row: drag handle, section number, delete */}
            <div className="flex items-center gap-2 mb-3">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-[#666] hover:text-[#999] touch-none"
                    aria-label="ドラッグして並べ替え"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="5" cy="3" r="1.5" />
                        <circle cx="11" cy="3" r="1.5" />
                        <circle cx="5" cy="8" r="1.5" />
                        <circle cx="11" cy="8" r="1.5" />
                        <circle cx="5" cy="13" r="1.5" />
                        <circle cx="11" cy="13" r="1.5" />
                    </svg>
                </button>
                <span className="text-xs text-[#666] font-medium">
                    セクション {index + 1}
                </span>
                <div className="flex-1" />
                <button
                    onClick={handleDelete}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${showDeleteConfirm
                        ? "bg-[#ef4444] text-white"
                        : "text-[#666] hover:text-[#ef4444]"
                        }`}
                >
                    {showDeleteConfirm ? "削除する" : "✕"}
                </button>
            </div>

            {/* Section name */}
            <input
                type="text"
                value={name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="セクション名"
                className="w-full bg-[#0f0f1a] text-white rounded-lg px-3 py-2 text-sm border border-[#2a2a3e] focus:border-[#3b82f6] focus:outline-none mb-2 placeholder-[#555]"
            />

            {/* Duration */}
            <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-[#888] whitespace-nowrap">持ち時間</label>
                <div className="relative flex-1">
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={durationRaw}
                        onChange={handleDurationChange}
                        onBlur={handleDurationBlur}
                        placeholder="0000"
                        className="w-full bg-[#0f0f1a] text-white rounded-lg px-3 py-2 text-sm font-mono tabular-nums border border-[#2a2a3e] focus:border-[#3b82f6] focus:outline-none placeholder-[#555]"
                    />
                    {durationRaw && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#888] font-mono">
                            {formatDurationInput(durationRaw)}
                        </span>
                    )}
                </div>
            </div>

            {/* Memo */}
            <textarea
                value={memo}
                onChange={(e) => onUpdate({ memo: e.target.value })}
                placeholder="発表メモを入力"
                rows={3}
                className="w-full bg-[#0f0f1a] text-white rounded-lg px-3 py-2 text-sm border border-[#2a2a3e] focus:border-[#3b82f6] focus:outline-none resize-none placeholder-[#555]"
            />
        </div>
    );
}

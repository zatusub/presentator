"use client";

import { useEffect, useCallback, use, useState } from "react";
import { useRouter } from "next/navigation";
import {
    DndContext,
    closestCenter,
    DragEndEvent,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { usePresentationStore } from "@/stores/presentationStore";
import { savePresentationToAPI } from "@/lib/api";
import { durationToMs, formatMmss, msToMmss } from "@/lib/formatTime";
import { SectionCard } from "@/components/SectionCard";
import { AddSectionButton } from "@/components/AddSectionButton";
import { showToast } from "@/components/Toast";

export default function EditPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const store = usePresentationStore();

    useEffect(() => {
        store.hydrate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Use a selector to ensure reactivity when the specific presentation updates
    const presentation = usePresentationStore(
        (state) => state.presentations.find((p) => p.id === id)
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 200, tolerance: 5 },
        })
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id || !presentation) return;

            const oldIndex = presentation.sections.findIndex(
                (s) => s.id === active.id
            );
            const newIndex = presentation.sections.findIndex(
                (s) => s.id === over.id
            );
            if (oldIndex === -1 || newIndex === -1) return;

            const newOrder = [...presentation.sections.map((s) => s.id)];
            newOrder.splice(oldIndex, 1);
            newOrder.splice(newIndex, 0, active.id as string);
            store.reorderSections(id, newOrder);
        },
        [presentation, store, id]
    );

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = useCallback(async () => {
        if (!presentation || isSaving) return;
        setIsSaving(true);
        try {
            const result = await savePresentationToAPI(presentation);
            if (result.shareId) {
                store.upsert({ ...presentation, shareId: result.shareId });
                showToast(`保存しました (ID: ${result.shareId.slice(0, 8)}...)`);
            } else {
                if (result.error === "auth") {
                    showToast("サーバー保存に失敗しました（AWS側の権限・CORSエラー）");
                } else if (result.error === "network") {
                    showToast("ネットワークエラーまたはURLの設定が正しくありません");
                } else {
                    showToast("サーバー保存でエラーが発生しました");
                }
            }
        } catch (err) {
            console.error("Error in handleSave:", err);
            showToast("ネットワークエラーが発生しました");
        } finally {
            setIsSaving(false);
        }
    }, [presentation, store, isSaving]);

    const handleCopyId = useCallback(async () => {
        const sid = presentation?.shareId;
        console.log("Attempting to copy shareId:", sid);
        if (!sid) {
            showToast("まず保存してください");
            return;
        }
        try {
            await navigator.clipboard.writeText(sid);
            showToast("コピーしました");
        } catch (err) {
            console.error("Copy failed:", err);
            showToast("コピーに失敗しました");
        }
    }, [presentation?.shareId]);

    const handleStart = useCallback(() => {
        if (!presentation) return;
        const unset = presentation.sections.find(
            (s) => !s.duration || s.duration.length === 0
        );
        if (unset) {
            showToast("すべてのセクションの持ち時間を設定してください");
            return;
        }
        if (presentation.sections.length === 0) {
            showToast("セクションを追加してください");
            return;
        }
        router.push(`/timer/${id}`);
    }, [presentation, router, id]);

    // Total time calculation
    const totalMs = presentation
        ? presentation.sections.reduce(
            (sum, s) => sum + durationToMs(s.duration),
            0
        )
        : 0;
    const totalDisplay = formatMmss(msToMmss(totalMs));

    if (!store.hydrated) {
        return (
            <div className="min-h-dvh flex items-center justify-center text-[#888]">
                読み込み中...
            </div>
        );
    }

    if (!presentation) {
        return (
            <div className="min-h-dvh flex flex-col items-center justify-center text-[#888] gap-4">
                <p>発表が見つかりません</p>
                <button
                    onClick={() => router.push("/")}
                    className="text-[#3b82f6] hover:underline text-sm"
                >
                    ← ホームに戻る
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a2e]">
                <button
                    onClick={() => router.push("/")}
                    className="text-[#888] hover:text-white text-sm transition-colors"
                >
                    ← 戻る
                </button>
                <button
                    onClick={() => router.push(`/json/${id}`)}
                    className="text-[#888] hover:text-white text-sm transition-colors"
                >
                    JSONで編集
                </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-36">
                {/* Title */}
                <input
                    type="text"
                    value={presentation.title}
                    onChange={(e) => store.updateTitle(id, e.target.value)}
                    placeholder="発表タイトルを入力"
                    className="w-full bg-transparent text-white text-xl font-bold border-none focus:outline-none mb-6 placeholder-[#555]"
                />

                {/* Sections */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={presentation.sections.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col gap-1">
                            <AddSectionButton
                                onClick={() => store.addSection(id, 0)}
                            />
                            {presentation.sections.map((section, index) => (
                                <div key={section.id}>
                                    <SectionCard
                                        id={section.id}
                                        name={section.name}
                                        duration={section.duration}
                                        memo={section.memo}
                                        index={index}
                                        onUpdate={(updates) =>
                                            store.updateSection(id, section.id, updates)
                                        }
                                        onDelete={() => store.removeSection(id, section.id)}
                                    />
                                    <AddSectionButton
                                        onClick={() => store.addSection(id, index + 1)}
                                    />
                                </div>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            {/* Fixed footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur border-t border-[#1a1a2e] px-4 py-3">
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-[#888]">
                            合計: <span className="text-white font-mono tabular-nums">{totalDisplay}</span>
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopyId}
                                className="text-xs text-[#888] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a3e] transition-colors"
                            >
                                IDをコピー
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${isSaving
                                ? "bg-[#161625] text-[#555] border-[#1a1a2e] cursor-not-allowed"
                                : "bg-[#1a1a2e] hover:bg-[#2a2a3e] text-white border-[#2a2a3e] active:scale-[0.98]"
                                }`}
                        >
                            {isSaving ? "保存中..." : "保存"}
                        </button>
                        <button
                            onClick={handleStart}
                            disabled={isSaving}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isSaving
                                ? "bg-[#254ea0] text-[#888] cursor-not-allowed"
                                : "bg-[#3b82f6] hover:bg-[#2563eb] text-white active:scale-[0.98]"
                                }`}
                        >
                            発表開始 →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePresentationStore } from "@/stores/presentationStore";
import { loadPresentationFromAPI } from "@/lib/api";
import { formatMmss, durationToMs } from "@/lib/formatTime";
import { showToast } from "@/components/Toast";
import type { Presentation } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const store = usePresentationStore();
  const [shareIdInput, setShareIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Swipe-to-delete state
  const touchStartX = useRef<Map<string, number>>(new Map());
  const [swipedId, setSwipedId] = useState<string | null>(null);

  useEffect(() => {
    store.hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateNew = useCallback(() => {
    const p = store.create();
    router.push(`/edit/${p.id}`);
  }, [store, router]);

  const handleLoadById = useCallback(async () => {
    if (!shareIdInput.trim()) return;
    setLoading(true);
    try {
      const p = await loadPresentationFromAPI(shareIdInput.trim());
      if (p) {
        store.upsert(p);
        router.push(`/edit/${p.id}`);
      } else {
        showToast("データが見つかりませんでした");
      }
    } catch {
      showToast("読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [shareIdInput, store, router]);

  const handleDelete = useCallback(
    (id: string) => {
      if (deleteTarget === id) {
        store.remove(id);
        setDeleteTarget(null);
        setSwipedId(null);
      } else {
        setDeleteTarget(id);
        setTimeout(() => setDeleteTarget(null), 3000);
      }
    },
    [deleteTarget, store]
  );

  const getTotalTime = (p: Presentation) => {
    const totalMs = p.sections.reduce(
      (sum, s) => sum + durationToMs(s.duration),
      0
    );
    return formatMmss(
      String(Math.floor(totalMs / 60000)).padStart(2, "0") +
      String(Math.floor((totalMs % 60000) / 1000)).padStart(2, "0")
    );
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-dvh flex flex-col px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-[#3b82f6]">⏱</span> Presentator
        </h1>
        <p className="text-sm text-[#888] mt-1">
          プレゼンテーションタイマー＆発表メモ
        </p>
      </div>

      {/* Create new */}
      <button
        onClick={handleCreateNew}
        className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-4 rounded-xl text-lg transition-colors mb-6"
      >
        新しい発表を作成 →
      </button>

      {/* Load by ID */}
      <div className="mb-8">
        <label className="text-sm text-[#888] mb-2 block">IDで読み込む</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={shareIdInput}
            onChange={(e) => setShareIdInput(e.target.value)}
            placeholder="共有IDを入力"
            className="flex-1 bg-[#1a1a2e] text-white rounded-xl px-4 py-3 text-sm border border-[#2a2a3e] focus:border-[#3b82f6] focus:outline-none placeholder-[#555]"
            onKeyDown={(e) => e.key === "Enter" && handleLoadById()}
          />
          <button
            onClick={handleLoadById}
            disabled={loading || !shareIdInput.trim()}
            className="bg-[#1a1a2e] hover:bg-[#2a2a3e] text-white px-5 py-3 rounded-xl text-sm border border-[#2a2a3e] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? "..." : "読み込む"}
          </button>
        </div>
      </div>

      {/* Saved presentations */}
      {store.hydrated && store.presentations.length > 0 && (
        <div>
          <h2 className="text-sm text-[#888] mb-3">保存済みの発表</h2>
          <div className="flex flex-col gap-3">
            {store.presentations.map((p) => (
              <div
                key={p.id}
                className="relative overflow-hidden rounded-xl"
                onTouchStart={(e) => {
                  touchStartX.current.set(p.id, e.touches[0].clientX);
                }}
                onTouchEnd={(e) => {
                  const startX = touchStartX.current.get(p.id);
                  if (startX === undefined) return;
                  const deltaX = e.changedTouches[0].clientX - startX;
                  if (deltaX < -80) {
                    setSwipedId(p.id);
                  } else {
                    setSwipedId(null);
                  }
                  touchStartX.current.delete(p.id);
                }}
              >
                {/* Delete background */}
                <div
                  className={`absolute inset-0 bg-red-500/20 flex items-center justify-end pr-4 transition-opacity ${swipedId === p.id ? "opacity-100" : "opacity-0"
                    }`}
                >
                  <button
                    onClick={() => handleDelete(p.id)}
                    className={`text-sm px-3 py-1 rounded-lg ${deleteTarget === p.id
                        ? "bg-red-500 text-white"
                        : "text-red-400"
                      }`}
                  >
                    {deleteTarget === p.id ? "本当に削除" : "削除"}
                  </button>
                </div>

                {/* Card */}
                <div
                  onClick={() => {
                    if (swipedId === p.id) {
                      setSwipedId(null);
                      return;
                    }
                    router.push(`/edit/${p.id}`);
                  }}
                  className={`bg-[#1a1a2e] rounded-xl p-4 border border-[#2a2a3e] cursor-pointer hover:border-[#3b82f6]/50 transition-all ${swipedId === p.id ? "translate-x-[-80px]" : "translate-x-0"
                    }`}
                  style={{ transition: "transform 0.2s ease" }}
                >
                  <div className="font-medium truncate">
                    {p.title || "無題の発表"}
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-[#888]">
                    <span>{p.sections.length} セクション</span>
                    <span>{getTotalTime(p)}</span>
                    <span>{formatDate(p.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {store.hydrated && store.presentations.length === 0 && (
        <div className="text-center text-[#555] text-sm mt-8">
          まだ発表がありません。<br />
          上のボタンから新しい発表を作成しましょう。
        </div>
      )}
    </div>
  );
}

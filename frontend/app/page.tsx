"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePresentationStore } from "@/stores/presentationStore";
import { loadPresentationFromAPI } from "@/lib/api";
import { formatMmss, durationToMs } from "@/lib/formatTime";
import { showToast } from "@/components/Toast";
import type { Presentation } from "@/lib/types";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Clock,
  Layers,
  Calendar,
  ChevronRight,
  Zap,
  Layout,
  LogIn
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const store = usePresentationStore();
  const [shareIdInput, setShareIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    store.hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timeout for delete confirmation via useEffect
  useEffect(() => {
    if (!deleteTarget) return;
    const timer = setTimeout(() => setDeleteTarget(null), 3000);
    return () => clearTimeout(timer);
  }, [deleteTarget]);

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
    (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
      e.stopPropagation();
      if (deleteTarget === id) {
        store.remove(id);
        setDeleteTarget(null);
      } else {
        setDeleteTarget(id);
      }
    },
    [deleteTarget, store]
  );

  const getTotalTime = (p: Presentation) => {
    const totalMs = p.sections.reduce(
      (sum, s) => sum + durationToMs(s.duration),
      0
    );
    const mm = Math.floor(totalMs / 60000);
    const ss = Math.floor((totalMs % 60000) / 1000);
    return `${mm}:${String(ss).padStart(2, "0")}`;
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      // Restore time information (HH:MM) for better identification
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 lg:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
        >
          {/* Header - Welcome */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-8 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[2rem] p-8 md:p-10 flex flex-col justify-center"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Zap className="w-6 h-6 text-white fill-white" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                Presentator
              </h1>
            </div>
            <p className="text-xl text-zinc-400 max-w-md leading-relaxed">
              あなたのプレゼンテーションを完璧に管理。<br />
              美しいタイマーとセクション管理で、伝えたいことを時間内に。
            </p>
          </motion.div>

          {/* Login Cell */}
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => showToast("現在、ログイン機能は準備中です。")}
            className="md:col-span-4 group bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] hover:border-white/20 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center transition-all overflow-hidden relative shadow-2xl shadow-black/5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ease-out">
              <LogIn className="w-8 h-8 text-zinc-400 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-1 group-hover:text-white transition-colors">ログイン</h3>
            <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">データをクラウドに同期する</p>
          </motion.button>

          {/* Load by ID Cell */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-12 lg:col-span-4 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[2rem] p-8"
          >
            <div className="flex items-center gap-2 mb-6 text-zinc-400">
              <Search className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">IDで読み込む</span>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={shareIdInput}
                  onChange={(e) => setShareIdInput(e.target.value)}
                  placeholder="共有コードを入力"
                  onKeyDown={(e) => e.key === "Enter" && handleLoadById()}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-zinc-600"
                />
              </div>
              <button
                type="button"
                onClick={handleLoadById}
                disabled={loading || !shareIdInput.trim()}
                className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 disabled:opacity-30 disabled:hover:bg-blue-600/10 disabled:cursor-not-allowed font-semibold py-4 rounded-2xl border border-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    データを同期 <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Stats / Info - "Bento" flavor */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-6 lg:col-span-4 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[2rem] p-8 flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6">
              <Layout className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-4xl font-bold tabular-nums mb-1">
                {store.presentations.length}
              </div>
              <div className="text-zinc-500 text-sm font-medium">保存済みのプロジェクト</div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="md:col-span-6 lg:col-span-4 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[2rem] p-8 flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-orange-600/20 rounded-2xl flex items-center justify-center mb-6">
              <Clock className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="text-zinc-100 text-sm font-medium leading-relaxed">
                各セクションの詳細な時間配分を<br />
                リアルタイムでトラッキング
              </div>
            </div>
          </motion.div>

          {/* List Section Title */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-12 mt-8 mb-2 flex items-center justify-between px-2"
          >
            <h2 className="text-2xl font-bold">マイプレゼンテーション</h2>
            {store.presentations.length > 0 && (
              <span className="text-zinc-500 text-sm">{store.presentations.length}件のアイテム</span>
            )}
          </motion.div>

          {/* Presentations List */}
          <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-white">
            <AnimatePresence mode="popLayout">
              {/* "Create New" First Item Card */}
              {store.hydrated && (
                <motion.button
                  key="create-new-card"
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -4 }}
                  onClick={handleCreateNew}
                  type="button"
                  className="group relative bg-blue-600/5 hover:bg-blue-600/10 backdrop-blur-xl border border-dashed border-blue-500/30 hover:border-blue-500/60 rounded-[1.5rem] p-6 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[160px]"
                >
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-blue-600/20">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div className="font-bold text-lg text-blue-400 group-hover:text-blue-300 transition-colors">
                    新規作成
                  </div>
                  <p className="text-xs text-blue-500/60 mt-1">
                    新しい発表を開始する
                  </p>
                </motion.button>
              )}

              {store.hydrated && store.presentations.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  whileHover={{ y: -4 }}
                  onClick={() => router.push(`/edit/${p.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(`/edit/${p.id}`);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.title || "無題の発表"} を編集`}
                  className="group relative bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] hover:border-blue-500/30 rounded-[1.5rem] p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="font-bold text-lg leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
                      {p.title || "無題の発表"}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, p.id)}
                      aria-label={`${p.title || "無題の発表"} を削除`}
                      title="削除"
                      className={`p-2 rounded-xl transition-all relative z-20 ${deleteTarget === p.id
                        ? "bg-red-500 text-white"
                        : "text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
                        }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-auto">
                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                      <Layers className="w-3.5 h-3.5" />
                      {p.sections.length} セクション
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {getTotalTime(p)}
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium ml-auto">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(p.updatedAt)}
                    </div>
                  </div>

                  {/* Delete Confirmation Overlay */}
                  <AnimatePresence>
                    {deleteTarget === p.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-red-500/10 rounded-[1.5rem] border border-red-500/50 pointer-events-none"
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 text-center text-zinc-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Presentator. Built for seamless speaking.</p>
      </footer>
    </div>
  );
}

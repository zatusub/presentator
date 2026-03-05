"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { usePresentationStore } from "@/stores/presentationStore";
import { showToast } from "@/components/Toast";
import type { Section } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

const TYPE_REFERENCE = `type Presentation = {
  title: string;
  sections: Section[];
}
type Section = {
  name: string;
  duration: string; // "mmss"形式の4桁数字 例: "0130" → 1分30秒
  memo: string;     // 改行は\\n
}`;

const SAMPLE_JSON = `{
  "title": "サンプル発表",
  "sections": [
    {
      "name": "導入",
      "duration": "0130",
      "memo": "自己紹介\\n課題の説明"
    },
    {
      "name": "デモ",
      "duration": "0300",
      "memo": "デモ操作の手順"
    }
  ]
}`;

type JsonPresentation = {
    title: string;
    sections: { name: string; duration: string; memo: string }[];
};

function validateJson(text: string): { data?: JsonPresentation; error?: string } {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        const msg = e instanceof SyntaxError ? e.message : "JSON構文エラー";
        return { error: msg };
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return { error: "ルートはオブジェクトである必要があります" };
    }

    const obj = parsed as Record<string, unknown>;

    if (typeof obj.title !== "string") {
        return { error: "`title` はstring型である必要があります" };
    }

    if (!Array.isArray(obj.sections)) {
        return { error: "`sections` は配列である必要があります" };
    }

    for (let i = 0; i < obj.sections.length; i++) {
        const s = obj.sections[i] as Record<string, unknown>;
        if (typeof s.name !== "string") {
            return { error: `sections[${i}].name はstring型である必要があります` };
        }
        if (typeof s.duration !== "string") {
            return { error: `sections[${i}].duration はstring型である必要があります` };
        }
        if (!/^\d{4}$/.test(s.duration as string)) {
            return {
                error: `sections[${i}].duration は4桁の数字文字列である必要があります (例: "0130")`,
            };
        }
        if (typeof s.memo !== "string") {
            return { error: `sections[${i}].memo はstring型である必要があります` };
        }
    }

    return { data: obj as unknown as JsonPresentation };
}

export default function JsonEditPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const store = usePresentationStore();
    const [jsonText, setJsonText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [refOpen, setRefOpen] = useState(false);

    useEffect(() => {
        store.hydrate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const presentation = store.getById(id);

    // Load current data into JSON editor
    useEffect(() => {
        if (presentation) {
            const data: JsonPresentation = {
                title: presentation.title,
                sections: presentation.sections.map((s) => ({
                    name: s.name,
                    duration: s.duration,
                    memo: s.memo,
                })),
            };
            setJsonText(JSON.stringify(data, null, 2));
        }
    }, [presentation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleApply = useCallback(() => {
        const result = validateJson(jsonText);
        if (result.error) {
            setError(result.error);
            return;
        }
        if (result.data && presentation) {
            setError(null);
            const sections: Section[] = result.data.sections.map((s) => ({
                id: uuidv4(),
                name: s.name,
                duration: s.duration,
                memo: s.memo,
            }));
            store.replacePresentation(id, result.data.title, sections);
            showToast("JSONを適用しました");
            router.push(`/edit/${id}`);
        }
    }, [jsonText, presentation, store, id, router]);

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

    // Line numbers
    const lines = jsonText.split("\n");

    return (
        <div className="min-h-dvh flex flex-col max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center px-4 py-3 border-b border-[#1a1a2e]">
                <button
                    onClick={() => router.push(`/edit/${id}`)}
                    className="text-[#888] hover:text-white text-sm transition-colors"
                >
                    ← 設定に戻る
                </button>
            </div>

            {/* Type reference (collapsible) */}
            <div className="px-4 py-2 border-b border-[#1a1a2e]">
                <button
                    onClick={() => setRefOpen(!refOpen)}
                    className="text-xs text-[#888] hover:text-white transition-colors flex items-center gap-1"
                >
                    <span className={`transition-transform ${refOpen ? "rotate-90" : ""}`}>
                        ▶
                    </span>
                    データ型リファレンス
                </button>
                {refOpen && (
                    <div className="mt-2 space-y-2">
                        <pre className="bg-[#1a1a2e] p-3 rounded-xl text-xs text-[#a0a0c0] font-mono overflow-x-auto">
                            {TYPE_REFERENCE}
                        </pre>
                        <div>
                            <p className="text-xs text-[#666] mb-1">サンプル:</p>
                            <pre className="bg-[#1a1a2e] p-3 rounded-xl text-xs text-[#a0a0c0] font-mono overflow-x-auto">
                                {SAMPLE_JSON}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            {/* JSON editor with line numbers */}
            <div className="flex-1 px-4 py-2 pb-24 overflow-y-auto">
                <div className="relative flex bg-[#0f0f1a] rounded-xl border border-[#2a2a3e] overflow-hidden">
                    {/* Line numbers */}
                    <div className="py-3 px-2 text-right select-none border-r border-[#2a2a3e] bg-[#0a0a15]">
                        {lines.map((_, i) => (
                            <div key={i} className="text-[10px] leading-5 text-[#555] font-mono">
                                {i + 1}
                            </div>
                        ))}
                    </div>
                    {/* Textarea */}
                    <textarea
                        value={jsonText}
                        onChange={(e) => {
                            setJsonText(e.target.value);
                            setError(null);
                        }}
                        className="flex-1 bg-transparent text-white p-3 text-sm font-mono leading-5 resize-none focus:outline-none min-h-[50vh]"
                        spellCheck={false}
                    />
                </div>
                {error && (
                    <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                        ❌ {error}
                    </div>
                )}
            </div>

            {/* Fixed footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur border-t border-[#1a1a2e] px-4 py-3">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={handleApply}
                        className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white py-3 rounded-xl text-sm font-bold transition-colors"
                    >
                        JSONを適用
                    </button>
                </div>
            </div>
        </div>
    );
}

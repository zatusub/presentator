"use client";

type MemoViewProps = {
    memo: string;
};

export function MemoView({ memo }: MemoViewProps) {
    return (
        <div className="flex-1 overflow-y-auto px-4 py-2">
            <div className="text-base leading-relaxed text-[#e0e0e0] whitespace-pre-wrap break-words">
                {memo || <span className="text-[#666] italic">メモなし</span>}
            </div>
        </div>
    );
}

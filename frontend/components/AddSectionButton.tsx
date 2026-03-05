"use client";

type AddSectionButtonProps = {
    onClick: () => void;
};

export function AddSectionButton({ onClick }: AddSectionButtonProps) {
    return (
        <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-[#333]" />
            <button
                onClick={onClick}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#666] hover:text-[#3b82f6] hover:bg-[#1a1a2e] transition-colors text-lg font-light"
                aria-label="セクションを追加"
            >
                ＋
            </button>
            <div className="flex-1 h-px bg-[#333]" />
        </div>
    );
}

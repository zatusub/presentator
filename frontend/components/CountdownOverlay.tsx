"use client";

import { useEffect, useState } from "react";

type CountdownOverlayProps = {
    value: number; // 3, 2, 1 or 0 (done)
    visible: boolean;
};

export function CountdownOverlay({ value, visible }: CountdownOverlayProps) {
    const [show, setShow] = useState(visible);
    const [animKey, setAnimKey] = useState(value);

    useEffect(() => {
        if (visible) {
            setShow(true);
            setAnimKey(value);
        } else {
            setShow(false);
        }
    }, [visible, value]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0a0a0a]/90">
            <div
                key={animKey}
                className="text-8xl font-bold text-[#3b82f6] animate-[countPulse_1s_ease-out]"
            >
                {value > 0 ? value : "GO"}
            </div>
        </div>
    );
}

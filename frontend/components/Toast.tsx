"use client";

import { useEffect, useState, useCallback } from "react";

type ToastMessage = {
    id: number;
    text: string;
};

let toastId = 0;
const listeners: Set<(msg: ToastMessage) => void> = new Set();

export function showToast(text: string) {
    const msg: ToastMessage = { id: ++toastId, text };
    listeners.forEach((fn) => fn(msg));
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((msg: ToastMessage) => {
        setToasts((prev) => [...prev, msg]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== msg.id));
        }, 2500);
    }, []);

    useEffect(() => {
        listeners.add(addToast);
        return () => {
            listeners.delete(addToast);
        };
    }, [addToast]);

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className="bg-[#1e293b] text-white px-4 py-2 rounded-xl text-sm shadow-lg border border-[#334155] animate-[fadeInOut_2.5s_ease-in-out]"
                >
                    {t.text}
                </div>
            ))}
        </div>
    );
}

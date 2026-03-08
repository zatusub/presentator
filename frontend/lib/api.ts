import {
    Presentation,
    Section,
    ApiSection,
} from "./types";
import { savePresentationAction, loadPresentationAction } from "@/app/actions";
import { durationToMs, msToMmss } from "./formatTime";
import { v4 as uuidv4 } from "uuid";

// ─── Model converters ───

function fromApiSection(s: ApiSection): Section {
    return {
        id: uuidv4(),
        name: s.title,
        duration: msToMmss(s.plannedSec * 1000),
        memo: s.memo,
    };
}

// ─── API calls (Via Server Actions) ───

/**
 * Save presentation to backend API via Server Actions.
 * Bypasses CORS.
 */
export async function savePresentationToAPI(
    p: Presentation
): Promise<{ shareId: string | null; error?: "auth" | "not_found" | "network" | "other" }> {
    // Reconstruct the exact payload requested by the user
    const payload = {
        action: "put",
        presentation: {
            title: p.title,
            settings: {
                vibration: true
            },
            sections: p.sections.map((s) => ({
                title: s.name,
                memo: s.memo,
                plannedSec: Math.max(0, Math.floor(durationToMs(s.duration) / 1000)),
            })),
            shareId: p.shareId, // Include for updates
        },
    };

    try {
        const data = await savePresentationAction(payload);

        if (!data.ok) {
            if (data.error === "HTTP_403") return { shareId: null, error: "auth" };
            if (data.error === "HTTP_404") return { shareId: null, error: "not_found" };
            return { shareId: null, error: "other" };
        }

        return { shareId: data.shareId ?? null };
    } catch (err) {
        console.error("API Call Error (Save):", err);
        return { shareId: null, error: "network" };
    }
}

/**
 * Load presentation from backend API via Server Actions.
 */
export async function loadPresentationFromAPI(
    shareId: string
): Promise<Presentation | null> {
    try {
        const data = await loadPresentationAction(shareId);
        if (data.ok && data.item) {
            const api = data.item.presentation;
            return {
                id: uuidv4(),
                title: api.title,
                sections: api.sections.map(fromApiSection),
                updatedAt: data.item.updatedAt,
                shareId: data.item.shareId,
            };
        }
        return null;
    } catch (err) {
        console.error("API Call Error (Load):", err);
        return null;
    }
}

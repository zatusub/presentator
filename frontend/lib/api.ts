import type {
    Presentation,
    Section,
    ApiPresentation,
    ApiSection,
    ApiPutResponse,
    ApiGetResponse,
} from "./types";
import { durationToMs, msToMmss } from "./formatTime";
import { v4 as uuidv4 } from "uuid";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
// Normalize URL: trim whitespace and remove trailing slash for consistency
const API_URL = RAW_API_URL.trim().replace(/\/$/, "");

// ─── Model converters ───

function toApiSection(s: Section): ApiSection {
    return {
        title: s.name,
        plannedSec: Math.floor(durationToMs(s.duration) / 1000),
        memo: s.memo,
    };
}

function fromApiSection(s: ApiSection): Section {
    return {
        id: uuidv4(),
        name: s.title,
        duration: msToMmss(s.plannedSec * 1000),
        memo: s.memo,
    };
}

function toApiPresentation(p: Presentation): ApiPresentation {
    return {
        title: p.title,
        sections: p.sections.map(toApiSection),
        settings: { vibration: true },
    };
}

// ─── API calls ───

/**
 * Save presentation to backend API.
 * Returns { shareId, error } where shareId is string if successful, otherwise error is defined.
 */
export async function savePresentationToAPI(
    p: Presentation
): Promise<{ shareId: string | null; error?: "auth" | "not_found" | "network" | "other" }> {
    const RAW_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
    const URL = RAW_URL.trim();
    // Ensure trailing slash as per spec example
    const FUNCTION_URL = URL.endsWith("/") ? URL : URL + "/";

    if (!URL) {
        console.warn("API_URL is empty.");
        return { shareId: null, error: "network" };
    }

    // Explicitly build the payload to match ref.md JSON structure
    const payload = {
        action: "put",
        presentation: {
            title: p.title,
            sections: p.sections.map((s) => ({
                title: s.name,
                plannedSec: Math.max(0, Math.floor(durationToMs(s.duration) / 1000)),
                memo: s.memo,
            })),
            settings: { vibration: true },
            shareId: p.shareId,
        },
    };

    try {
        const res = await fetch(FUNCTION_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const body = await res.text().catch(() => "no-body");
            console.error(`API Error ${res.status}`); // Hide body/details from general console unless explicitly looking at errors
            if (res.status === 403) return { shareId: null, error: "auth" };
            if (res.status === 404) return { shareId: null, error: "not_found" };
            return { shareId: null, error: "other" };
        }

        const data: ApiPutResponse = await res.json();
        return { shareId: data.shareId ?? null };
    } catch (err) {
        return { shareId: null, error: "network" };
    }
}

/**
 * Load presentation from backend API by shareId.
 * Returns a Presentation object or null on failure.
 */
export async function loadPresentationFromAPI(
    shareId: string
): Promise<Presentation | null> {
    if (!API_URL) return null;
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "get", shareId }),
        });
        const data: ApiGetResponse = JSON.parse(await res.text());
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
    } catch {
        return null;
    }
}

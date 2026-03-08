"use server";

import { ApiPutResponse, ApiGetResponse } from "@/lib/types";

const API_URL = process.env.API_URL || "";

/**
 * Server Action to save presentation data to AWS Lambda.
 * Bypasses browser CORS by making the request from the Node.js server.
 */
export async function savePresentationAction(payload: any): Promise<ApiPutResponse> {
    if (!API_URL) {
        return { ok: false, error: "API_URL_NOT_CONFIGURED" };
    }

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`Lambda API Error (${res.status}):`, errorText);
            return { ok: false, error: `HTTP_${res.status}` };
        }

        return await res.json();
    } catch (err) {
        console.error("Server Action Exception (save):", err);
        return { ok: false, error: "SERVER_ACTION_EXCEPTION" };
    }
}

/**
 * Server Action to load presentation data from AWS Lambda.
 */
export async function loadPresentationAction(shareId: string): Promise<ApiGetResponse> {
    if (!API_URL) {
        return { ok: false, error: "API_URL_NOT_CONFIGURED" };
    }

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ action: "get", shareId }),
        });

        if (!res.ok) {
            return { ok: false, error: `HTTP_${res.status}` };
        }

        return await res.json();
    } catch (err) {
        console.error("Server Action Exception (load):", err);
        return { ok: false, error: "SERVER_ACTION_EXCEPTION" };
    }
}

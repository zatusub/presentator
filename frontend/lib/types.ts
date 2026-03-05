// ─── Internal App Types ───

export type Section = {
    id: string;
    name: string;
    duration: string; // "mmss" 4-digit string, e.g. "0130" = 1m30s
    memo: string;
};

export type Presentation = {
    id: string;
    title: string;
    sections: Section[];
    updatedAt: string; // ISO 8601
    shareId?: string;
};

// ─── API Types ───

export type ApiSection = {
    title: string;
    plannedSec: number;
    memo: string;
};

export type ApiPresentation = {
    title: string;
    sections: ApiSection[];
    settings: { vibration: boolean };
};

export type ApiPutResponse = {
    ok: boolean;
    shareId?: string;
    error?: string;
};

export type ApiGetResponse = {
    ok: boolean;
    item?: {
        shareId: string;
        createdAt: string;
        updatedAt: string;
        presentation: ApiPresentation;
    };
    error?: string;
};

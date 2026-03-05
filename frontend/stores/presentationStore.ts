import { create } from "zustand";
import type { Presentation, Section } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "presentator_presentations";

function loadFromStorage(): Presentation[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveToStorage(presentations: Presentation[]) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presentations));
    } catch {
        // Storage full or unavailable
    }
}

type PresentationStore = {
    presentations: Presentation[];
    hydrated: boolean;
    hydrate: () => void;
    getById: (id: string) => Presentation | undefined;
    create: () => Presentation;
    upsert: (p: Presentation) => void;
    remove: (id: string) => void;
    updateTitle: (id: string, title: string) => void;
    addSection: (id: string, index: number) => void;
    removeSection: (id: string, sectionId: string) => void;
    updateSection: (
        id: string,
        sectionId: string,
        updates: Partial<Pick<Section, "name" | "duration" | "memo">>
    ) => void;
    reorderSections: (id: string, sectionIds: string[]) => void;
    replacePresentation: (id: string, title: string, sections: Section[]) => void;
};

export const usePresentationStore = create<PresentationStore>((set, get) => {
    const persist = (updater: (state: PresentationStore) => Partial<PresentationStore>) => {
        set((state) => {
            const changes = updater(state);
            const newPresentations = (changes.presentations ?? state.presentations) as Presentation[];
            saveToStorage(newPresentations);
            return { ...changes, presentations: newPresentations };
        });
    };

    const updatePresentation = (
        id: string,
        fn: (p: Presentation) => Presentation
    ) => {
        persist((state) => ({
            presentations: state.presentations.map((p) =>
                p.id === id ? fn({ ...p, updatedAt: new Date().toISOString() }) : p
            ),
        }));
    };

    return {
        presentations: [],
        hydrated: false,

        hydrate: () => {
            const presentations = loadFromStorage();
            set({ presentations, hydrated: true });
        },

        getById: (id: string) => get().presentations.find((p) => p.id === id),

        create: () => {
            const newP: Presentation = {
                id: uuidv4(),
                title: "",
                sections: [
                    { id: uuidv4(), name: "", duration: "", memo: "" },
                ],
                updatedAt: new Date().toISOString(),
            };
            persist((state) => ({
                presentations: [newP, ...state.presentations],
            }));
            return newP;
        },

        upsert: (p: Presentation) => {
            persist((state) => {
                const exists = state.presentations.some((x) => x.id === p.id);
                if (exists) {
                    return {
                        presentations: state.presentations.map((x) =>
                            x.id === p.id ? { ...p, updatedAt: new Date().toISOString() } : x
                        ),
                    };
                }
                return {
                    presentations: [{ ...p, updatedAt: new Date().toISOString() }, ...state.presentations],
                };
            });
        },

        remove: (id: string) => {
            persist((state) => ({
                presentations: state.presentations.filter((p) => p.id !== id),
            }));
        },

        updateTitle: (id, title) => {
            updatePresentation(id, (p) => ({ ...p, title }));
        },

        addSection: (id, index) => {
            updatePresentation(id, (p) => {
                const newSection: Section = {
                    id: uuidv4(),
                    name: "",
                    duration: "",
                    memo: "",
                };
                const sections = [...p.sections];
                sections.splice(index, 0, newSection);
                return { ...p, sections };
            });
        },

        removeSection: (id, sectionId) => {
            updatePresentation(id, (p) => ({
                ...p,
                sections: p.sections.filter((s) => s.id !== sectionId),
            }));
        },

        updateSection: (id, sectionId, updates) => {
            updatePresentation(id, (p) => ({
                ...p,
                sections: p.sections.map((s) =>
                    s.id === sectionId ? { ...s, ...updates } : s
                ),
            }));
        },

        reorderSections: (id, sectionIds) => {
            updatePresentation(id, (p) => {
                const sectionMap = new Map(p.sections.map((s) => [s.id, s]));
                const reordered = sectionIds
                    .map((sid) => sectionMap.get(sid))
                    .filter(Boolean) as Section[];
                return { ...p, sections: reordered };
            });
        },

        replacePresentation: (id, title, sections) => {
            updatePresentation(id, (p) => ({ ...p, title, sections }));
        },
    };
});

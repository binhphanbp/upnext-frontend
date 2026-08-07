import { create } from "zustand";

/**
 * UI-only state (§15.2): the drawer, drafts and local preferences live here.
 * Conversations, messages and analysis results belong to TanStack Query — never
 * mirror server data into this store.
 */
type AiCopilotUiState = {
  isDrawerOpen: boolean;
  /** Keyed by conversation id so a draft survives switching threads. */
  drafts: Record<string, string>;
  /** Collapsed by default once a run finishes; the user can pin it open. */
  isRunTimelinePinned: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setDraft: (conversationId: string, draft: string) => void;
  clearDraft: (conversationId: string) => void;
  toggleRunTimelinePinned: () => void;
};

export const useAiCopilotUiStore = create<AiCopilotUiState>((set) => ({
  isDrawerOpen: false,
  drafts: {},
  isRunTimelinePinned: false,
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  setDraft: (conversationId, draft) =>
    set((state) => ({ drafts: { ...state.drafts, [conversationId]: draft } })),
  clearDraft: (conversationId) =>
    set((state) => {
      const drafts = { ...state.drafts };
      delete drafts[conversationId];
      return { drafts };
    }),
  toggleRunTimelinePinned: () =>
    set((state) => ({ isRunTimelinePinned: !state.isRunTimelinePinned })),
}));

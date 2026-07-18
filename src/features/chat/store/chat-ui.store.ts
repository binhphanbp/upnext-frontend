import { create } from "zustand";

type MobilePane = "list" | "thread" | "context";

type ChatUiState = {
  activeConversationId: string | null;
  mobilePane: MobilePane;
  drafts: Record<string, string>;
  typingExpiresAt: Record<string, Record<string, number>>;
  setActiveConversation: (id: string | null) => void;
  setMobilePane: (pane: MobilePane) => void;
  setDraft: (conversationId: string, draft: string) => void;
  setTyping: (conversationId: string, participantId: string, expiresAt: string | null) => void;
  clearConversation: (conversationId: string) => void;
  reset: () => void;
};

const emptyTypingExpiresAt: Readonly<Record<string, number>> = Object.freeze({});

export function selectTypingExpiresAt(state: ChatUiState, conversationId: string) {
  return state.typingExpiresAt[conversationId] ?? emptyTypingExpiresAt;
}

const initialState = {
  activeConversationId: null,
  mobilePane: "list" as MobilePane,
  drafts: {},
  typingExpiresAt: {},
};

export const useChatUiStore = create<ChatUiState>((set) => ({
  ...initialState,
  setActiveConversation: (activeConversationId) =>
    set({ activeConversationId, mobilePane: activeConversationId ? "thread" : "list" }),
  setMobilePane: (mobilePane) => set({ mobilePane }),
  setDraft: (conversationId, draft) =>
    set((state) => ({ drafts: { ...state.drafts, [conversationId]: draft } })),
  setTyping: (conversationId, participantId, expiresAt) =>
    set((state) => {
      const conversationTyping = { ...(state.typingExpiresAt[conversationId] ?? {}) };
      if (expiresAt) conversationTyping[participantId] = new Date(expiresAt).getTime();
      else delete conversationTyping[participantId];
      return {
        typingExpiresAt: { ...state.typingExpiresAt, [conversationId]: conversationTyping },
      };
    }),
  clearConversation: (conversationId) =>
    set((state) => {
      const drafts = { ...state.drafts };
      const typingExpiresAt = { ...state.typingExpiresAt };
      delete drafts[conversationId];
      delete typingExpiresAt[conversationId];
      return { drafts, typingExpiresAt };
    }),
  reset: () => set(initialState),
}));

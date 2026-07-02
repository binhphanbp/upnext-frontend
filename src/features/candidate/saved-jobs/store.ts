import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SavedJobsState {
  savedJobIds: string[];
  saveJob: (id: string) => void;
  unsaveJob: (id: string) => void;
  toggleSaveJob: (id: string) => void;
  isSaved: (id: string) => boolean;
}

export const useSavedJobsStore = create<SavedJobsState>()(
  persist(
    (set, get) => ({
      savedJobIds: ["fpt-java-fresher", "vnpay-senior-frontend"],
      saveJob: (id) => {
        if (!get().savedJobIds.includes(id)) {
          set({ savedJobIds: [...get().savedJobIds, id] });
        }
      },
      unsaveJob: (id) => {
        set({ savedJobIds: get().savedJobIds.filter((jobId) => jobId !== id) });
      },
      toggleSaveJob: (id) => {
        const isCurrentlySaved = get().savedJobIds.includes(id);
        if (isCurrentlySaved) {
          get().unsaveJob(id);
        } else {
          get().saveJob(id);
        }
      },
      isSaved: (id) => get().savedJobIds.includes(id),
    }),
    {
      name: "upnext.candidate.savedJobs",
    },
  ),
);

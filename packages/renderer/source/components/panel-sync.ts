import { create } from 'zustand'

type PanelSyncState = {
  preferredPanelTitles: string[]
  addPreferredPanelTitle: (title: string) => void
}

export const usePanelSyncStore = create<PanelSyncState>((set) => ({
  preferredPanelTitles: [],
  addPreferredPanelTitle: (title) =>
    set((state) => ({
      preferredPanelTitles: [
        ...state.preferredPanelTitles.filter((preferredTitle) => preferredTitle !== title),
        title,
      ],
    })),
}))

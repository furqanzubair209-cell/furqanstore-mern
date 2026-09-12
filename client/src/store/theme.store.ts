import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "dark" | "light";

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
};

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggle: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: "furqanstore-theme",
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);

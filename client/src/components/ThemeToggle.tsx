import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../store/theme.store";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`p-1.5 rounded-full text-[rgb(var(--c-text)/0.7)] hover:text-gold transition shrink-0 ${className}`}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

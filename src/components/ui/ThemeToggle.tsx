"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      aria-label="Changer le thème"
      title="Changer le thème"
      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:scale-105 transition"
    >
      {theme === "dark" ? (
        <Sun size={18} className="text-yellow-400" />
      ) : (
        <Moon size={18} className="text-slate-700 dark:text-slate-200" />
      )}
    </button>
  );
}

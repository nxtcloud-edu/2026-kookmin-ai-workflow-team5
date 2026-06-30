"use client";

import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      aria-label={`현재 ${theme === "light" ? "라이트" : "다크"} 모드, 테마 전환`}
      className="themeToggle"
      onClick={toggleTheme}
      type="button"
    >
      <span className={theme === "light" ? "active" : ""}>Light</span>
      <span className={theme === "dark" ? "active" : ""}>Dark</span>
    </button>
  );
}
